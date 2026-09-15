import json
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from schemas.assessment import AssessmentResponse, SymptomPayload
from schemas.chat import ChatExplainResponse, ChatIntakeResponse
from services.assessment_service import AssessmentService
from services.llm_service import LLMService, LLMServiceUnavailableError

logger = logging.getLogger(__name__)

ALLOWED_SYMPTOM_KEYS = list(SymptomPayload.model_fields.keys())

INTAKE_SYSTEM_PROMPT = (
    "You extract dental symptom mentions from a patient's free-text description. "
    "You do not diagnose, explain conditions, or give medical advice — you only "
    "detect which of the following symptom keys the text explicitly implies:\n"
    f"{', '.join(ALLOWED_SYMPTOM_KEYS)}\n\n"
    "Respond with ONLY a JSON object (no markdown, no prose) of the form "
    '{"symptoms": {"<key>": true|false}}. Include a key ONLY if the text '
    "clearly implies that symptom is present (true) or explicitly denies it "
    "(false). Omit any key the text doesn't address — never guess. Use only "
    "keys from the list above; never invent new keys."
)

EXPLAIN_REFUSAL = (
    "I can only answer questions about this assessment's own results. Please "
    "ask about the conditions detected, why they were flagged, or the "
    "recommended next steps shown on this page."
)

EXPLAIN_SYSTEM_TEMPLATE = (
    "You are Dr. Ava's explainer assistant. You never diagnose, never suggest "
    "conditions beyond what is listed below, and never give medical advice "
    "outside this data. This assessment's result (the sole source of truth — "
    "Prolog already produced it; you only explain it in plain language):\n\n"
    "{context}\n\n"
    "Answer the user's question using ONLY the information above. If the "
    "question asks about anything not covered by this data (a different "
    "condition, a new diagnosis, general medical advice, or anything "
    f'unrelated), reply with exactly: "{EXPLAIN_REFUSAL}"'
)


async def extract_symptoms(text: str, llm_service: LLMService) -> ChatIntakeResponse:
    """Parses free-text symptom descriptions into validated symptoms{} keys."""
    try:
        raw_reply = await llm_service.complete(
            system_prompt=INTAKE_SYSTEM_PROMPT,
            user_message=text,
            max_tokens=400,
        )
        parsed = json.loads(raw_reply)
        extracted = parsed["symptoms"]
        if not isinstance(extracted, dict):
            raise ValueError("symptoms must be an object")
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning("Chat intake: unparseable LLM response: %s", exc)
        raise LLMServiceUnavailableError() from exc

    symptoms: dict[str, bool] = {}
    unrecognized: list[str] = []
    for key, value in extracted.items():
        if key not in ALLOWED_SYMPTOM_KEYS:
            unrecognized.append(key)
            continue
        symptoms[key] = bool(value)

    return ChatIntakeResponse(symptoms=symptoms, unrecognized=unrecognized)


async def explain_assessment(
    assessment_id: str,
    question: str,
    user_id: uuid.UUID,
    db: AsyncSession,
    assessment_service: AssessmentService,
    llm_service: LLMService,
) -> ChatExplainResponse:
    """Answers a question grounded strictly in one assessment's own data."""
    assessment = await assessment_service.get_for_user(assessment_id, user_id, db)
    if not assessment.diagnoses:
        context = f"Risk level: {assessment.risk_level.value}\nNo conditions were detected."
    else:
        lines = [f"Risk level: {assessment.risk_level.value}", ""]
        for diagnosis in assessment.diagnoses:
            lines.append(f"Condition: {diagnosis.condition.value}")
            lines.append(f"Explanation: {diagnosis.explanation}")
            lines.append(f"Triggered rules: {', '.join(diagnosis.triggered_rules)}")
            for rec in diagnosis.recommendations:
                lines.append(f"Recommendation ({rec.urgency.value}): {rec.action}")
            lines.append("")
        context = "\n".join(lines)
    system_prompt = EXPLAIN_SYSTEM_TEMPLATE.format(context=context)

    answer = await llm_service.complete(
        system_prompt=system_prompt,
        user_message=question,
        max_tokens=400,
    )
    return ChatExplainResponse(answer=answer.strip())
