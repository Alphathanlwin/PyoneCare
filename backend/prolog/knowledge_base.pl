% ============================================================
% OHAS Knowledge Base
% File: backend/prolog/knowledge_base.pl
%
% IMPORTANT: symptom/1 facts are asserted dynamically at runtime.
% Do NOT define them here.
% ============================================================
:- dynamic symptom/1.
:- discontiguous possible/1.
:- discontiguous risk_level/2.
:- discontiguous explanation/2.
:- discontiguous recommendation/3.


% ============================================================
% CONDITION: DENTAL CAVITY (dental_cavity)
% Clinical basis: Visible dark spot + cold sensitivity are
% primary indicators. Chewing pain elevates likelihood.
% ============================================================
possible(dental_cavity) :-
    symptom(black_spot),
    symptom(cold_sensitivity).
possible(dental_cavity) :-
    symptom(black_spot),
    symptom(pressure_pain).

risk_level(dental_cavity, high) :-
    possible(dental_cavity),
    symptom(pressure_pain),
    symptom(spontaneous_pain).
risk_level(dental_cavity, high) :-
    possible(dental_cavity),
    symptom(pressure_pain).
risk_level(dental_cavity, medium) :-
    possible(dental_cavity).

explanation(dental_cavity,
    "A visible dark spot combined with cold sensitivity or pain on chewing \
suggests the presence of a dental cavity (caries). The decay has likely \
penetrated the enamel layer.").

recommendation(dental_cavity, "Visit a dentist within 1 week for examination and possible filling.", within_1_week).
recommendation(dental_cavity, "Avoid very cold, hot, or sweet foods until seen by a dentist.", monitor_at_home).

% ============================================================
% CONDITION: GINGIVITIS (gingivitis)
% Clinical basis: Bleeding and swollen gums are hallmark signs.
% Bad breath is a supporting indicator.
% ============================================================
possible(gingivitis) :-
    symptom(bleeding_gums),
    symptom(swollen_gums).
possible(gingivitis) :-
    symptom(bleeding_gums),
    symptom(bad_breath).

risk_level(gingivitis, high) :-
    possible(gingivitis),
    symptom(receding_gums).
risk_level(gingivitis, medium) :-
    possible(gingivitis).

explanation(gingivitis,
    "Bleeding and swollen gums are classic signs of gingivitis, an early \
stage of gum disease caused by plaque buildup along the gum line.").

recommendation(gingivitis, "Schedule a dental cleaning (scale and polish) within 1 month.", within_1_month).
recommendation(gingivitis, "Brush gently twice daily and floss daily.", monitor_at_home).

% ============================================================
% CONDITION: TOOTH ABSCESS (tooth_abscess)
% Clinical basis: Combination of spontaneous severe pain,
% bad taste/breath, and swelling indicates likely abscess.
% This is HIGH risk — urgent care needed.
% ============================================================
possible(tooth_abscess) :-
    symptom(spontaneous_pain),
    symptom(swollen_gums),
    symptom(bad_breath).
possible(tooth_abscess) :-
    symptom(spontaneous_pain),
    symptom(pressure_pain),
    symptom(swollen_gums).

risk_level(tooth_abscess, high) :-
    possible(tooth_abscess).

explanation(tooth_abscess,
    "Spontaneous pain combined with swelling and bad breath suggests a \
tooth abscess — a bacterial infection at the root or surrounding gum tissue. \
This requires prompt dental attention.").

recommendation(tooth_abscess, "Seek dental care as soon as possible — within 24-48 hours.", immediate).
recommendation(tooth_abscess, "Do not apply heat to the affected area.", monitor_at_home).

% ============================================================
% CONDITION: ENAMEL EROSION (enamel_erosion)
% Clinical basis: Both cold and hot sensitivity without a
% visible dark spot suggests enamel thinning from acid exposure.
% ============================================================
possible(enamel_erosion) :-
    symptom(cold_sensitivity),
    symptom(hot_sensitivity),
    symptom(acid_exposure).
possible(enamel_erosion) :-
    symptom(cold_sensitivity),
    symptom(hot_sensitivity),
    symptom(sugary_diet),
    \+ symptom(black_spot).

risk_level(enamel_erosion, high) :-
    possible(enamel_erosion),
    symptom(yellow_staining).
risk_level(enamel_erosion, medium) :-
    possible(enamel_erosion).

explanation(enamel_erosion,
    "Sensitivity to both cold and hot temperatures without a visible dark spot \
suggests enamel erosion — the wearing away of the tooth's protective outer layer, \
often caused by acidic foods/drinks or acid reflux.").

recommendation(enamel_erosion, "Book a dental check-up within 1 month.", within_1_month).
recommendation(enamel_erosion, "Reduce acidic drinks (sodas, citrus juice). Use a soft toothbrush.", monitor_at_home).

% ============================================================
% CONDITION: CANKER SORES (canker_sores)
% Clinical basis: Mouth ulcer with burning sensation is
% the primary indicator.
% ============================================================
possible(canker_sores) :-
    symptom(mouth_ulcer),
    symptom(burning_sensation).
possible(canker_sores) :-
    symptom(mouth_ulcer),
    symptom(white_spot).

risk_level(canker_sores, medium) :-
    possible(canker_sores),
    symptom(swollen_gums).
risk_level(canker_sores, low) :-
    possible(canker_sores).

explanation(canker_sores,
    "A painful sore inside the mouth with burning sensation is characteristic \
of canker sores (aphthous ulcers). These are usually benign and heal on their own \
within 1-2 weeks.").

recommendation(canker_sores, "Use over-the-counter topical numbing gel for pain relief.", monitor_at_home).
recommendation(canker_sores, "See a dentist if the ulcer has not healed within 2 weeks.", within_1_month).

% ============================================================
% CONDITION: TOOTH SENSITIVITY (tooth_sensitivity)
% Clinical basis: Sharp pain with cold/hot only (no black spot,
% no ulcer, no structural damage). Isolated sensitivity.
% ============================================================
possible(tooth_sensitivity) :-
    symptom(cold_sensitivity),
    \+ symptom(black_spot),
    \+ symptom(spontaneous_pain),
    \+ symptom(mouth_ulcer).
possible(tooth_sensitivity) :-
    symptom(hot_sensitivity),
    \+ symptom(black_spot),
    \+ symptom(spontaneous_pain).

risk_level(tooth_sensitivity, medium) :-
    possible(tooth_sensitivity),
    symptom(receding_gums).
risk_level(tooth_sensitivity, low) :-
    possible(tooth_sensitivity).

explanation(tooth_sensitivity,
    "Sharp pain in response to cold or hot stimuli without other visible \
signs suggests dentinal hypersensitivity — often caused by exposed dentin \
from enamel wear or gum recession.").

recommendation(tooth_sensitivity, "Use a desensitising toothpaste (e.g., Sensodyne) twice daily.", monitor_at_home).
recommendation(tooth_sensitivity, "Book a routine dental check-up within 1 month.", within_1_month).

% ============================================================
% OVERALL RISK LEVEL
% Derives the highest risk level across all detected conditions.
% ============================================================
overall_risk(high) :-
    possible(Condition),
    risk_level(Condition, high), !.
overall_risk(medium) :-
    possible(Condition),
    risk_level(Condition, medium), !.
overall_risk(low) :-
    possible(_), !.
overall_risk(low).   % default if no conditions detected

% ============================================================
% QUERY / REPORTING HELPERS
% Called by prolog_service.py once symptom/1 facts are asserted for a
% request. possible/1 and risk_level/2 can each match a condition through
% more than one clause (deliberately — see the clinical rules above), so a
% naive findall((possible(C), risk_level(C, R))) yields duplicate and
% contradictory rows per condition. report/0 dedupes conditions with
% sort/2 and takes the first (highest-severity, by clause order) matching
% risk_level/explanation via once/1, then emits pipe-delimited lines for
% the Python subprocess bridge to parse.
% ============================================================
report :-
    findall(C, possible(C), Cs0),
    sort(Cs0, Cs),
    forall(member(C, Cs), report_condition(C)),
    ( overall_risk(OR) -> true ; OR = low ),
    format("OVERALL|~w~n", [OR]).

report_condition(C) :-
    ( once(risk_level(C, R)) -> true ; R = low ),
    ( once(explanation(C, Expl)) -> true ; Expl = "" ),
    format("COND|~w|~w|~w~n", [C, R, Expl]),
    forall(
        recommendation(C, Action, Urgency),
        format("REC|~w|~w|~w~n", [C, Action, Urgency])
    ).
