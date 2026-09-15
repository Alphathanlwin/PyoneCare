import asyncio
import logging
import tempfile
import uuid
from pathlib import Path

from exceptions import PrologEngineErrorException

logger = logging.getLogger(__name__)

KB_PATH = Path(__file__).resolve().parent.parent / "prolog" / "knowledge_base.pl"
QUERY_TIMEOUT_SECONDS = 10
RISK_LEVELS = {"LOW", "MEDIUM", "HIGH"}


class PrologService:
    """Bridges to SWI-Prolog via subprocess (per architecture.md's documented
    Windows-safe fallback — pyswip's embedded engine is flaky on Windows and
    isn't request-isolated for concurrent async requests).
    """

    async def diagnose(self, active_symptoms: list[str]) -> dict:
        """Runs knowledge_base.pl against the given symptom keys.

        Returns:
            {
                "overall_risk": "LOW" | "MEDIUM" | "HIGH",
                "diagnoses": [
                    {
                        "condition": "DENTAL_CAVITY",
                        "risk_level": "HIGH",
                        "explanation": str,
                        "recommendations": [{"action": str, "urgency": "WITHIN_1_WEEK"}],
                    },
                    ...
                ],
            }

        Raises PrologEngineErrorException if the swipl subprocess fails,
        times out, or produces output that can't be parsed.
        """
        script = self._build_script(active_symptoms)

        with tempfile.TemporaryDirectory() as tmpdir:
            script_path = Path(tmpdir) / f"{uuid.uuid4()}.pl"
            script_path.write_text(script, encoding="utf-8")

            proc = None
            try:
                proc = await asyncio.create_subprocess_exec(
                    "swipl",
                    "-q",
                    "-g",
                    "true",
                    "-t",
                    "halt",
                    str(script_path),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(), timeout=QUERY_TIMEOUT_SECONDS
                )
            except (OSError, asyncio.TimeoutError) as exc:
                if proc is not None and proc.returncode is None:
                    proc.kill()
                logger.error("SWI-Prolog subprocess failed to run: %s", exc)
                raise PrologEngineErrorException() from exc

        if proc.returncode != 0:
            logger.error(
                "SWI-Prolog exited %s: %s", proc.returncode, stderr.decode(errors="replace")
            )
            raise PrologEngineErrorException()

        return self._parse_report(stdout.decode("utf-8", errors="replace"))

    def _build_script(self, active_symptoms: list[str]) -> str:
        # active_symptoms only ever contains keys from SymptomPayload's fixed
        # field set or cv_service.CV_LABEL_TO_SYMPTOM's fixed values — never
        # arbitrary user text — so interpolating as bare Prolog atoms is safe.
        # SWI-Prolog on Windows otherwise reads source files and writes
        # stdout using the system codepage (e.g. cp1252), silently mangling
        # non-ASCII characters like the em dashes in knowledge_base.pl.
        kb = str(KB_PATH.resolve()).replace("\\", "/").replace("'", "\\'")
        lines = [
            ":- set_prolog_flag(encoding, utf8).",
            ":- set_stream(user_output, encoding(utf8)).",
            f":- consult('{kb}').",
        ]
        lines += [f"symptom({key})." for key in active_symptoms]
        lines += [
            ":- catch(report, E, (print_message(error, E), halt(1))).",
            ":- halt.",
        ]
        return "\n".join(lines) + "\n"

    def _parse_report(self, output: str) -> dict:
        diagnoses: dict[str, dict] = {}
        overall_risk = "LOW"

        for line in output.splitlines():
            line = line.strip()
            if not line:
                continue

            parts = line.split("|")
            tag = parts[0]

            if tag == "OVERALL" and len(parts) == 2:
                overall_risk = parts[1].upper()
            elif tag == "COND" and len(parts) == 4:
                _, condition, risk, explanation = parts
                diagnoses[condition] = {
                    "condition": condition.upper(),
                    "risk_level": risk.upper(),
                    "explanation": explanation,
                    "recommendations": [],
                }
            elif tag == "REC" and len(parts) == 4:
                _, condition, action, urgency = parts
                if condition in diagnoses:
                    diagnoses[condition]["recommendations"].append(
                        {"action": action, "urgency": urgency.upper()}
                    )
            else:
                logger.warning("Unrecognized Prolog report line: %r", line)

        if overall_risk not in RISK_LEVELS:
            logger.error("Unexpected overall_risk from Prolog output: %r", overall_risk)
            raise PrologEngineErrorException()

        return {"overall_risk": overall_risk, "diagnoses": list(diagnoses.values())}
