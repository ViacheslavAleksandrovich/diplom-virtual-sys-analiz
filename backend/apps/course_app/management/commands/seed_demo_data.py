from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.analytics_app.models import ModuleStatistics, StudentStatistics, TaskStatistics
from apps.course_app.models import CourseModule, ModuleProgress, Task, TaskResult, TheoryMaterial
from apps.gamification_app.models import StudentRanking


User = get_user_model()


MODULES_PAYLOAD = [
    {
        "order_number": 1,
        "title": "System Thinking Fundamentals",
        "description": "Core concepts of systems, boundaries, stakeholders, and decomposition.",
        "estimated_hours": 6,
        "icon": "layers",
        "theory": [
            {
                "order_number": 1,
                "title": "What is a System?",
                "html_content": """
                    <h3>System concept</h3>
                    <p>A system is a set of interconnected elements that work together to achieve a goal.</p>
                    <p>In system analysis, we define boundaries, inputs, outputs, and constraints.</p>
                """,
            },
            {
                "order_number": 2,
                "title": "Stakeholders and Requirements",
                "html_content": """
                    <h3>Stakeholder analysis</h3>
                    <p>Identify key stakeholders and map functional and non-functional requirements.</p>
                    <p>Use MoSCoW prioritization and traceability matrix for consistency.</p>
                """,
            },
            {
                "order_number": 3,
                "title": "Functional Decomposition",
                "html_content": """
                    <h3>Decomposition strategy</h3>
                    <p>Break a complex system into smaller sub-systems with clear interfaces.</p>
                    <p>Each sub-system should have explicit inputs, outputs, and responsibility boundaries.</p>
                """,
            },
        ],
        "tasks": [
            {
                "order_number": 1,
                "title": "System boundary definition",
                "task_type": "multiple_choice",
                "difficulty_level": 1,
                "condition_text": """
                    <p>Which artifact best defines what is <strong>inside</strong> and <strong>outside</strong> a system?</p>
                    <ul>
                      <li>A — Gantt chart</li>
                      <li>B — Context diagram</li>
                      <li>C — Unit test plan</li>
                      <li>D — Risk register</li>
                    </ul>
                """,
                "reference_answer": {"answer": "B"},
                "explanation": "Context diagram is used to define system scope and external actors.",
                "points": 10,
                "tolerance": 0.01,
            },
            {
                "order_number": 2,
                "title": "Requirements quality",
                "task_type": "text_answer",
                "difficulty_level": 1,
                "condition_text": "<p>Name one key quality criterion for a requirement.</p>",
                "reference_answer": {"answer": "testability"},
                "explanation": "Good requirement quality criteria include clarity, testability, and consistency.",
                "points": 12,
                "tolerance": 0.01,
            },
            {
                "order_number": 3,
                "title": "Context model relation count",
                "task_type": "calculation",
                "difficulty_level": 1,
                "condition_text": "<p>If 5 external actors each interact with 2 system functions, how many interactions are modeled?</p>",
                "reference_answer": {"value": 10},
                "explanation": "5 * 2 = 10 interactions.",
                "points": 10,
                "tolerance": 0.01,
            },
            {
                "order_number": 4,
                "title": "Goal hierarchy skeleton",
                "task_type": "hierarchy",
                "difficulty_level": 2,
                "condition_text": "<p>Build hierarchy: Goal → Inputs, Processing, Outputs.</p>",
                "reference_answer": {
                    "nodes": [{"id": "goal"}, {"id": "inputs"}, {"id": "processing"}, {"id": "outputs"}],
                    "edges": [
                        {"source": "goal", "target": "inputs"},
                        {"source": "goal", "target": "processing"},
                        {"source": "goal", "target": "outputs"},
                    ],
                },
                "explanation": "Top-level system goal should be connected with three core sub-areas.",
                "points": 14,
                "tolerance": 0.01,
            },
        ],
    },
    {
        "order_number": 2,
        "title": "Analytic Hierarchy Process (AHP)",
        "description": "Pairwise comparison, priority vectors, and consistency validation for decision making.",
        "estimated_hours": 8,
        "icon": "bar-chart-3",
        "theory": [
            {
                "order_number": 1,
                "title": "AHP basics",
                "html_content": """
                    <h3>AHP overview</h3>
                    <p>AHP compares alternatives in pairs and derives priorities.</p>
                    <p>Consistency is validated with the ratio CR = CI / RI, where acceptable CR is below 0.1.</p>
                """,
            },
            {
                "order_number": 2,
                "title": "Priority vector and consistency",
                "html_content": """
                    <h3>Computation flow</h3>
                    <p>Build pairwise matrix, compute priority vector, then check consistency index.</p>
                    <p>Use pedagogical feedback when consistency is violated.</p>
                """,
            },
            {
                "order_number": 3,
                "title": "Interpretation of priorities",
                "html_content": """
                    <h3>Interpreting results</h3>
                    <p>Priority vector values represent relative preference of alternatives.</p>
                    <p>Higher value means stronger contribution to the decision goal.</p>
                """,
            },
        ],
        "tasks": [
            {
                "order_number": 1,
                "title": "AHP matrix consistency check",
                "task_type": "matrix",
                "difficulty_level": 2,
                "condition_text": """
                    <p>Provide a valid pairwise comparison matrix for three criteria with reciprocal symmetry.</p>
                    <p>Matrix must have ones on diagonal and satisfy <code>a[i][j] * a[j][i] ≈ 1</code>.</p>
                """,
                "reference_answer": {
                    "matrix": [
                        [1, 3, 5],
                        [1 / 3, 1, 2],
                        [1 / 5, 1 / 2, 1],
                    ]
                },
                "explanation": "Correct reciprocal matrix and consistent priorities produce CR below threshold.",
                "points": 20,
                "tolerance": 0.01,
            },
            {
                "order_number": 2,
                "title": "Weighted score calculation",
                "task_type": "calculation",
                "difficulty_level": 2,
                "condition_text": """
                    <p>Given weights (0.5, 0.3, 0.2) and normalized scores (0.8, 0.6, 0.7), calculate weighted sum.</p>
                """,
                "reference_answer": {"value": 0.72},
                "explanation": "0.5×0.8 + 0.3×0.6 + 0.2×0.7 = 0.72",
                "points": 16,
                "tolerance": 0.01,
            },
            {
                "order_number": 3,
                "title": "AHP judgement scale",
                "task_type": "multiple_choice",
                "difficulty_level": 2,
                "condition_text": """
                    <p>In Saaty scale, which value corresponds to <strong>strong importance</strong>?</p>
                    <ul>
                      <li>A — 3</li>
                      <li>B — 5</li>
                      <li>C — 7</li>
                      <li>D — 9</li>
                    </ul>
                """,
                "reference_answer": {"answer": "B"},
                "explanation": "Value 5 in Saaty scale denotes strong importance.",
                "points": 12,
                "tolerance": 0.01,
            },
            {
                "order_number": 4,
                "title": "AHP result explanation",
                "task_type": "text_answer",
                "difficulty_level": 2,
                "condition_text": "<p>What does CR &gt; 0.1 usually indicate in AHP?</p>",
                "reference_answer": {"answer": "inconsistent judgments"},
                "explanation": "High CR indicates inconsistency in pairwise comparisons.",
                "points": 14,
                "tolerance": 0.01,
            },
        ],
    },
    {
        "order_number": 3,
        "title": "Decision Models and KPI Trees",
        "description": "Hierarchical decomposition of goals, criteria, and alternatives.",
        "estimated_hours": 7,
        "icon": "git-branch",
        "theory": [
            {
                "order_number": 1,
                "title": "Hierarchy modeling",
                "html_content": """
                    <h3>Hierarchy structure</h3>
                    <p>Model goal decomposition as nodes and relations.</p>
                    <p>Clear structure improves explainability and auditability of decisions.</p>
                """,
            },
            {
                "order_number": 2,
                "title": "KPI tree validation",
                "html_content": """
                    <h3>Validation rules</h3>
                    <p>Each KPI node must map to exactly one parent criterion at each level.</p>
                    <p>Disconnected nodes reduce interpretability and should be flagged.</p>
                """,
            }
        ],
        "tasks": [
            {
                "order_number": 1,
                "title": "Build KPI hierarchy",
                "task_type": "hierarchy",
                "difficulty_level": 3,
                "condition_text": """
                    <p>Build a goal hierarchy: Goal → Cost, Quality, Time.</p>
                    <p>Connect nodes with valid edges.</p>
                """,
                "reference_answer": {
                    "nodes": [
                        {"id": "goal"},
                        {"id": "cost"},
                        {"id": "quality"},
                        {"id": "time"},
                    ],
                    "edges": [
                        {"source": "goal", "target": "cost"},
                        {"source": "goal", "target": "quality"},
                        {"source": "goal", "target": "time"},
                    ],
                },
                "explanation": "The goal node must connect to all first-level criteria.",
                "points": 24,
                "tolerance": 0.01,
            },
            {
                "order_number": 2,
                "title": "Coverage score",
                "task_type": "calculation",
                "difficulty_level": 2,
                "condition_text": "<p>A model has 9 required KPI nodes, 8 are present. Calculate coverage percentage.</p>",
                "reference_answer": {"value": 88.89},
                "explanation": "(8 / 9) * 100 = 88.89",
                "points": 12,
                "tolerance": 0.02,
            },
            {
                "order_number": 3,
                "title": "Modeling quality criterion",
                "task_type": "text_answer",
                "difficulty_level": 2,
                "condition_text": "<p>Name one criterion of a good decision model structure.</p>",
                "reference_answer": {"answer": "consistency"},
                "explanation": "Typical criteria include consistency, completeness, and traceability.",
                "points": 10,
                "tolerance": 0.01,
            },
            {
                "order_number": 4,
                "title": "Node classification",
                "task_type": "multiple_choice",
                "difficulty_level": 1,
                "condition_text": """
                    <p>Which node should be placed at the highest level of a hierarchy?</p>
                    <ul>
                      <li>A — Alternative</li>
                      <li>B — Criterion</li>
                      <li>C — Goal</li>
                      <li>D — Metric value</li>
                    </ul>
                """,
                "reference_answer": {"answer": "C"},
                "explanation": "The goal defines the top-level objective of the hierarchy.",
                "points": 10,
                "tolerance": 0.01,
            }
        ],
    },
    {
        "order_number": 4,
        "title": "Project Prioritization and Scoring",
        "description": "Comparative scoring of initiatives by value, risk, cost, and implementation effort.",
        "estimated_hours": 6,
        "icon": "clipboard-list",
        "theory": [
            {
                "order_number": 1,
                "title": "Prioritization frameworks",
                "html_content": """
                    <h3>Framework options</h3>
                    <p>Weighted scoring, WSJF, and MoSCoW are common prioritization techniques.</p>
                    <p>Choose method based on data quality, team maturity, and decision speed.</p>
                """,
            },
            {
                "order_number": 2,
                "title": "Risk-adjusted value",
                "html_content": """
                    <h3>Expected value</h3>
                    <p>Risk-adjusted decisions account for uncertainty and potential downside impact.</p>
                    <p>Use sensitivity analysis before final roadmap commitments.</p>
                """,
            },
        ],
        "tasks": [
            {
                "order_number": 1,
                "title": "Priority by weighted score",
                "task_type": "calculation",
                "difficulty_level": 2,
                "condition_text": "<p>Calculate score: 0.4*80 + 0.3*60 + 0.2*70 + 0.1*90.</p>",
                "reference_answer": {"value": 73},
                "explanation": "32 + 18 + 14 + 9 = 73.",
                "points": 14,
                "tolerance": 0.01,
            },
            {
                "order_number": 2,
                "title": "Select prioritization method",
                "task_type": "multiple_choice",
                "difficulty_level": 1,
                "condition_text": """
                    <p>Which method is best for strict deadline with uncertainty in effort estimates?</p>
                    <ul>
                      <li>A — WSJF</li>
                      <li>B — Random choice</li>
                      <li>C — Alphabetical order</li>
                      <li>D — FIFO only</li>
                    </ul>
                """,
                "reference_answer": {"answer": "A"},
                "explanation": "WSJF balances cost of delay with job size.",
                "points": 10,
                "tolerance": 0.01,
            },
            {
                "order_number": 3,
                "title": "Explain trade-off",
                "task_type": "text_answer",
                "difficulty_level": 2,
                "condition_text": "<p>State one trade-off between delivery speed and solution quality.</p>",
                "reference_answer": {"answer": "technical debt"},
                "explanation": "Faster delivery can increase technical debt if quality safeguards are skipped.",
                "points": 12,
                "tolerance": 0.01,
            },
            {
                "order_number": 4,
                "title": "Initiative dependency map",
                "task_type": "hierarchy",
                "difficulty_level": 3,
                "condition_text": "<p>Create map: Goal → Foundation, FeatureA, FeatureB.</p>",
                "reference_answer": {
                    "nodes": [{"id": "goal"}, {"id": "foundation"}, {"id": "featureA"}, {"id": "featureB"}],
                    "edges": [
                        {"source": "goal", "target": "foundation"},
                        {"source": "goal", "target": "featureA"},
                        {"source": "goal", "target": "featureB"},
                    ],
                },
                "explanation": "A simple dependency hierarchy clarifies release sequencing.",
                "points": 18,
                "tolerance": 0.01,
            },
        ],
    },
    {
        "order_number": 5,
        "title": "Quality Metrics and Improvement Loop",
        "description": "Operational metrics, baselines, and continuous improvement cycles.",
        "estimated_hours": 5,
        "icon": "activity",
        "theory": [
            {
                "order_number": 1,
                "title": "Metric baselines",
                "html_content": """
                    <h3>Baseline establishment</h3>
                    <p>A baseline captures current-state performance and enables objective improvement tracking.</p>
                """,
            },
            {
                "order_number": 2,
                "title": "PDCA cycle",
                "html_content": """
                    <h3>Continuous improvement</h3>
                    <p>Plan, Do, Check, Act cycle helps maintain systematic quality improvements.</p>
                """,
            },
        ],
        "tasks": [
            {
                "order_number": 1,
                "title": "Defect reduction rate",
                "task_type": "calculation",
                "difficulty_level": 1,
                "condition_text": "<p>Defects reduced from 40 to 30. Calculate reduction percentage.</p>",
                "reference_answer": {"value": 25},
                "explanation": "((40 - 30) / 40) * 100 = 25%.",
                "points": 10,
                "tolerance": 0.01,
            },
            {
                "order_number": 2,
                "title": "PDCA step order",
                "task_type": "multiple_choice",
                "difficulty_level": 1,
                "condition_text": """
                    <p>Which sequence is correct?</p>
                    <ul>
                      <li>A — Do, Plan, Check, Act</li>
                      <li>B — Plan, Do, Check, Act</li>
                      <li>C — Check, Plan, Do, Act</li>
                      <li>D — Act, Check, Plan, Do</li>
                    </ul>
                """,
                "reference_answer": {"answer": "B"},
                "explanation": "PDCA starts from planning before execution and validation.",
                "points": 10,
                "tolerance": 0.01,
            },
            {
                "order_number": 3,
                "title": "Quality KPI rationale",
                "task_type": "text_answer",
                "difficulty_level": 2,
                "condition_text": "<p>Name one KPI suitable for software quality monitoring.</p>",
                "reference_answer": {"answer": "defect density"},
                "explanation": "Defect density, escaped defects, and MTTR are common quality KPIs.",
                "points": 12,
                "tolerance": 0.01,
            },
            {
                "order_number": 4,
                "title": "Quality factor hierarchy",
                "task_type": "hierarchy",
                "difficulty_level": 2,
                "condition_text": "<p>Build: Quality → Reliability, Maintainability, Usability.</p>",
                "reference_answer": {
                    "nodes": [{"id": "quality"}, {"id": "reliability"}, {"id": "maintainability"}, {"id": "usability"}],
                    "edges": [
                        {"source": "quality", "target": "reliability"},
                        {"source": "quality", "target": "maintainability"},
                        {"source": "quality", "target": "usability"},
                    ],
                },
                "explanation": "Quality factors are represented as first-level criteria under quality goal.",
                "points": 16,
                "tolerance": 0.01,
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Student profiles: each entry defines one demo student and their activity.
# task_results: keyed by (module_order_number, task_order_number)
#   status: "correct" | "partial" | "incorrect"
#   score:  0-100
#   answer: submitted_answer JSON
#   attempts: number of attempts
# ---------------------------------------------------------------------------
STUDENT_PROFILES = [
    {
        "email": "alice.chen@example.com",
        "username": "alice.chen@example.com",
        "first_name": "Alice",
        "last_name": "Chen",
        "password": "DemoPass123!",
        "ranking": {"total_points": 540, "level": 5, "experience_points": 540, "achievements_count": 8},
        # Completed all 5 modules
        "module_progress": {
            1: {"completion_percent": 100, "total_score": 46, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            2: {"completion_percent": 100, "total_score": 62, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            3: {"completion_percent": 100, "total_score": 56, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            4: {"completion_percent": 100, "total_score": 54, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            5: {"completion_percent": 100, "total_score": 48, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
        },
        "task_results": {
            (1, 1): {"status": "correct",   "score": 100, "answer": {"answer": "B"},                    "attempts": 1},
            (1, 2): {"status": "correct",   "score": 100, "answer": {"answer": "testability"},          "attempts": 1},
            (1, 3): {"status": "correct",   "score": 100, "answer": {"value": 10},                      "attempts": 1},
            (1, 4): {"status": "correct",   "score": 100, "answer": {"nodes": [{"id": "goal"}, {"id": "inputs"}, {"id": "processing"}, {"id": "outputs"}], "edges": [{"source": "goal", "target": "inputs"}, {"source": "goal", "target": "processing"}, {"source": "goal", "target": "outputs"}]}, "attempts": 1},
            (2, 1): {"status": "correct",   "score": 100, "answer": {"matrix": [[1, 3, 5], [0.333, 1, 2], [0.2, 0.5, 1]]}, "attempts": 2},
            (2, 2): {"status": "correct",   "score": 100, "answer": {"value": 0.72},                    "attempts": 1},
            (2, 3): {"status": "correct",   "score": 100, "answer": {"answer": "B"},                    "attempts": 1},
            (2, 4): {"status": "correct",   "score": 100, "answer": {"answer": "inconsistent judgments"}, "attempts": 1},
            (3, 1): {"status": "correct",   "score": 100, "answer": {"nodes": [{"id": "goal"}, {"id": "cost"}, {"id": "quality"}, {"id": "time"}], "edges": [{"source": "goal", "target": "cost"}, {"source": "goal", "target": "quality"}, {"source": "goal", "target": "time"}]}, "attempts": 1},
            (3, 2): {"status": "correct",   "score": 100, "answer": {"value": 88.89},                   "attempts": 1},
            (3, 3): {"status": "correct",   "score": 100, "answer": {"answer": "consistency"},          "attempts": 1},
            (3, 4): {"status": "correct",   "score": 100, "answer": {"answer": "C"},                    "attempts": 1},
            (4, 1): {"status": "correct",   "score": 100, "answer": {"value": 73},                      "attempts": 1},
            (4, 2): {"status": "correct",   "score": 100, "answer": {"answer": "A"},                    "attempts": 1},
            (4, 3): {"status": "correct",   "score": 100, "answer": {"answer": "technical debt"},       "attempts": 1},
            (4, 4): {"status": "correct",   "score": 100, "answer": {"nodes": [{"id": "goal"}, {"id": "foundation"}, {"id": "featureA"}, {"id": "featureB"}], "edges": [{"source": "goal", "target": "foundation"}, {"source": "goal", "target": "featureA"}, {"source": "goal", "target": "featureB"}]}, "attempts": 1},
            (5, 1): {"status": "correct",   "score": 100, "answer": {"value": 25},                      "attempts": 1},
            (5, 2): {"status": "correct",   "score": 100, "answer": {"answer": "B"},                    "attempts": 1},
            (5, 3): {"status": "correct",   "score": 100, "answer": {"answer": "defect density"},       "attempts": 1},
            (5, 4): {"status": "correct",   "score": 100, "answer": {"nodes": [{"id": "quality"}, {"id": "reliability"}, {"id": "maintainability"}, {"id": "usability"}], "edges": [{"source": "quality", "target": "reliability"}, {"source": "quality", "target": "maintainability"}, {"source": "quality", "target": "usability"}]}, "attempts": 1},
        },
    },
    {
        "email": "bob.martinez@example.com",
        "username": "bob.martinez@example.com",
        "first_name": "Bob",
        "last_name": "Martinez",
        "password": "DemoPass123!",
        "ranking": {"total_points": 370, "level": 4, "experience_points": 370, "achievements_count": 5},
        # Completed 3 modules, in progress on 4th
        "module_progress": {
            1: {"completion_percent": 100, "total_score": 44, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            2: {"completion_percent": 100, "total_score": 55, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            3: {"completion_percent": 100, "total_score": 50, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            4: {"completion_percent": 50,  "total_score": 24, "theory_viewed_percent": 70,  "tasks_completed": 2, "status": "in_progress"},
        },
        "task_results": {
            (1, 1): {"status": "correct",   "score": 100, "answer": {"answer": "B"},              "attempts": 1},
            (1, 2): {"status": "correct",   "score": 100, "answer": {"answer": "testability"},    "attempts": 2},
            (1, 3): {"status": "correct",   "score": 100, "answer": {"value": 10},                "attempts": 1},
            (1, 4): {"status": "partial",   "score": 70,  "answer": {"nodes": [{"id": "goal"}, {"id": "inputs"}, {"id": "outputs"}], "edges": [{"source": "goal", "target": "inputs"}, {"source": "goal", "target": "outputs"}]}, "attempts": 2},
            (2, 1): {"status": "partial",   "score": 75,  "answer": {"matrix": [[1, 2, 4], [0.5, 1, 2], [0.25, 0.5, 1]]}, "attempts": 3},
            (2, 2): {"status": "correct",   "score": 100, "answer": {"value": 0.72},              "attempts": 1},
            (2, 3): {"status": "correct",   "score": 100, "answer": {"answer": "B"},              "attempts": 1},
            (2, 4): {"status": "correct",   "score": 100, "answer": {"answer": "inconsistent judgments"}, "attempts": 1},
            (3, 1): {"status": "partial",   "score": 65,  "answer": {"nodes": [{"id": "goal"}, {"id": "cost"}, {"id": "quality"}], "edges": [{"source": "goal", "target": "cost"}, {"source": "goal", "target": "quality"}]}, "attempts": 2},
            (3, 2): {"status": "correct",   "score": 100, "answer": {"value": 88.89},             "attempts": 1},
            (3, 3): {"status": "correct",   "score": 100, "answer": {"answer": "consistency"},    "attempts": 1},
            (3, 4): {"status": "correct",   "score": 100, "answer": {"answer": "C"},              "attempts": 1},
            (4, 1): {"status": "correct",   "score": 100, "answer": {"value": 73},                "attempts": 1},
            (4, 2): {"status": "correct",   "score": 100, "answer": {"answer": "A"},              "attempts": 1},
        },
    },
    {
        "email": "carol.white@example.com",
        "username": "carol.white@example.com",
        "first_name": "Carol",
        "last_name": "White",
        "password": "DemoPass123!",
        "ranking": {"total_points": 215, "level": 3, "experience_points": 215, "achievements_count": 3},
        # Completed 2 modules, in progress on 3rd
        "module_progress": {
            1: {"completion_percent": 100, "total_score": 40, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            2: {"completion_percent": 100, "total_score": 48, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            3: {"completion_percent": 50,  "total_score": 22, "theory_viewed_percent": 60,  "tasks_completed": 2, "status": "in_progress"},
        },
        "task_results": {
            (1, 1): {"status": "correct",   "score": 100, "answer": {"answer": "B"},                "attempts": 1},
            (1, 2): {"status": "partial",   "score": 60,  "answer": {"answer": "clarity"},          "attempts": 2},
            (1, 3): {"status": "correct",   "score": 100, "answer": {"value": 10},                  "attempts": 2},
            (1, 4): {"status": "incorrect", "score": 0,   "answer": {"nodes": [{"id": "goal"}], "edges": []}, "attempts": 3},
            (2, 1): {"status": "partial",   "score": 60,  "answer": {"matrix": [[1, 2, 3], [0.5, 1, 1.5], [0.33, 0.67, 1]]}, "attempts": 3},
            (2, 2): {"status": "correct",   "score": 100, "answer": {"value": 0.72},                "attempts": 1},
            (2, 3): {"status": "correct",   "score": 100, "answer": {"answer": "B"},                "attempts": 1},
            (2, 4): {"status": "partial",   "score": 70,  "answer": {"answer": "wrong answers"},    "attempts": 2},
            (3, 1): {"status": "partial",   "score": 55,  "answer": {"nodes": [{"id": "goal"}, {"id": "cost"}, {"id": "quality"}], "edges": [{"source": "goal", "target": "cost"}]}, "attempts": 2},
            (3, 2): {"status": "correct",   "score": 100, "answer": {"value": 88.89},               "attempts": 2},
        },
    },
    {
        "email": "david.kim@example.com",
        "username": "david.kim@example.com",
        "first_name": "David",
        "last_name": "Kim",
        "password": "DemoPass123!",
        "ranking": {"total_points": 105, "level": 2, "experience_points": 105, "achievements_count": 1},
        # Completed 1 module, struggling on 2nd
        "module_progress": {
            1: {"completion_percent": 100, "total_score": 32, "theory_viewed_percent": 100, "tasks_completed": 4, "status": "completed"},
            2: {"completion_percent": 25,  "total_score": 12, "theory_viewed_percent": 40,  "tasks_completed": 1, "status": "in_progress"},
        },
        "task_results": {
            (1, 1): {"status": "correct",   "score": 100, "answer": {"answer": "B"},              "attempts": 2},
            (1, 2): {"status": "incorrect", "score": 0,   "answer": {"answer": "measurable"},     "attempts": 3},
            (1, 3): {"status": "correct",   "score": 100, "answer": {"value": 10},                "attempts": 2},
            (1, 4): {"status": "incorrect", "score": 0,   "answer": {"nodes": [], "edges": []},   "attempts": 3},
            (2, 1): {"status": "partial",   "score": 50,  "answer": {"matrix": [[1, 1, 1], [1, 1, 1], [1, 1, 1]]}, "attempts": 4},
        },
    },
    {
        "email": "eve.johnson@example.com",
        "username": "eve.johnson@example.com",
        "first_name": "Eve",
        "last_name": "Johnson",
        "password": "DemoPass123!",
        "ranking": {"total_points": 42, "level": 1, "experience_points": 42, "achievements_count": 0},
        # Just started, only partially done with module 1
        "module_progress": {
            1: {"completion_percent": 25, "total_score": 22, "theory_viewed_percent": 50, "tasks_completed": 2, "status": "in_progress"},
        },
        "task_results": {
            (1, 1): {"status": "correct",   "score": 100, "answer": {"answer": "B"},          "attempts": 1},
            (1, 2): {"status": "partial",   "score": 60,  "answer": {"answer": "accuracy"},   "attempts": 2},
        },
    },
    {
        "email": "student.demo@example.com",
        "username": "student.demo@example.com",
        "first_name": "Demo",
        "last_name": "Student",
        "password": "DemoPass123!",
        "ranking": {"total_points": 130, "level": 2, "experience_points": 130, "achievements_count": 2},
        "module_progress": {
            1: {"completion_percent": 75, "total_score": 36, "theory_viewed_percent": 100, "tasks_completed": 3, "status": "in_progress"},
            2: {"completion_percent": 25, "total_score": 16, "theory_viewed_percent": 50,  "tasks_completed": 1, "status": "in_progress"},
        },
        "task_results": {
            (1, 1): {"status": "correct",   "score": 100, "answer": {"answer": "B"},              "attempts": 1},
            (1, 2): {"status": "correct",   "score": 100, "answer": {"answer": "testability"},    "attempts": 2},
            (1, 3): {"status": "correct",   "score": 100, "answer": {"value": 10},                "attempts": 1},
            (2, 1): {"status": "partial",   "score": 60,  "answer": {"matrix": [[1, 2, 3], [0.5, 1, 2], [0.33, 0.5, 1]]}, "attempts": 3},
        },
    },
]


class Command(BaseCommand):
    help = "Seed idempotent demo data for modules, theory, tasks, and base analytics."

    def add_arguments(self, parser):
        parser.add_argument("--quiet", action="store_true", help="Suppress verbose output")

    @transaction.atomic
    def handle(self, *args, **options):
        quiet = options["quiet"]
        self._ensure_demo_users()

        created_modules = 0
        created_tasks = 0
        created_theory = 0

        for module_data in MODULES_PAYLOAD:
            theory_payload = module_data.pop("theory")
            tasks_payload = module_data.pop("tasks")

            module, module_created = CourseModule.objects.update_or_create(
                order_number=module_data["order_number"],
                defaults={**module_data, "is_active": True},
            )
            created_modules += int(module_created)

            for theory_item in theory_payload:
                _, theory_created = TheoryMaterial.objects.update_or_create(
                    module=module,
                    order_number=theory_item["order_number"],
                    defaults={**theory_item, "is_active": True},
                )
                created_theory += int(theory_created)

            for task_item in tasks_payload:
                _, task_created = Task.objects.update_or_create(
                    module=module,
                    order_number=task_item["order_number"],
                    defaults={**task_item, "is_active": True},
                )
                created_tasks += int(task_created)

            module_data["theory"] = theory_payload
            module_data["tasks"] = tasks_payload

        self._seed_rich_student_data()
        self._seed_analytics_rows()

        if not quiet:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Demo seed complete: modules={CourseModule.objects.count()} "
                    f"(new {created_modules}), theory={TheoryMaterial.objects.count()} "
                    f"(new {created_theory}), tasks={Task.objects.count()} (new {created_tasks}), "
                    f"students={User.objects.filter(role='student').count()}."
                )
            )

    def _ensure_demo_users(self):
        """Create all demo users defined in STUDENT_PROFILES plus teacher and admin."""
        for profile in STUDENT_PROFILES:
            if not User.objects.filter(email=profile["email"]).exists():
                User.objects.create_user(
                    email=profile["email"],
                    username=profile["username"],
                    password=profile["password"],
                    role="student",
                    first_name=profile["first_name"],
                    last_name=profile["last_name"],
                )

        if not User.objects.filter(email="teacher.demo@example.com").exists():
            User.objects.create_user(
                email="teacher.demo@example.com",
                username="teacher.demo@example.com",
                password="DemoPass123!",
                role="teacher",
                first_name="Demo",
                last_name="Teacher",
            )

        if not User.objects.filter(email="admin.demo@example.com").exists():
            User.objects.create_user(
                email="admin.demo@example.com",
                username="admin.demo@example.com",
                password="DemoPass123!",
                role="admin",
                first_name="Demo",
                last_name="Admin",
                is_staff=True,
            )

    def _seed_rich_student_data(self):
        """Create TaskResult, ModuleProgress, StudentRanking, StudentStatistics for each profile."""
        # Build lookup maps
        task_map = {
            (t.module.order_number, t.order_number): t
            for t in Task.objects.select_related("module").filter(is_active=True)
        }
        module_map = {
            m.order_number: m
            for m in CourseModule.objects.filter(is_active=True)
        }

        for profile in STUDENT_PROFILES:
            try:
                student = User.objects.get(email=profile["email"])
            except User.DoesNotExist:
                continue

            # --- TaskResult ---
            total_points = 0
            total_score_sum = 0
            correct_count = 0
            total_attempts_sum = 0
            result_count = 0

            for (mod_order, task_order), r in profile["task_results"].items():
                task = task_map.get((mod_order, task_order))
                if not task:
                    continue
                points_earned = round(task.points * r["score"] / 100)
                total_points += points_earned
                total_score_sum += r["score"]
                total_attempts_sum += r["attempts"]
                result_count += 1
                if r["status"] == "correct":
                    correct_count += 1

                TaskResult.objects.get_or_create(
                    student=student,
                    task=task,
                    defaults={
                        "submitted_answer": r["answer"],
                        "status": r["status"],
                        "score": r["score"],
                        "points_earned": points_earned,
                        "attempts_count": r["attempts"],
                        "completed_at": timezone.now(),
                        "feedback": "",
                    },
                )

            # --- ModuleProgress ---
            for mod_order, prog in profile["module_progress"].items():
                module = module_map.get(mod_order)
                if not module:
                    continue
                ModuleProgress.objects.get_or_create(
                    student=student,
                    module=module,
                    defaults={
                        **prog,
                        "started_at": timezone.now(),
                        "completed_at": timezone.now() if prog["status"] == "completed" else None,
                    },
                )

            # --- StudentRanking ---
            StudentRanking.objects.get_or_create(
                student=student,
                defaults=profile["ranking"],
            )

            # --- StudentStatistics derived from actual results ---
            avg_score = round(total_score_sum / result_count, 1) if result_count else 0.0
            avg_attempts = round(total_attempts_sum / result_count, 1) if result_count else 0.0
            success_rate = round(correct_count / result_count * 100, 1) if result_count else 0.0
            learning_hours = round(result_count * 0.4, 1)

            StudentStatistics.objects.get_or_create(
                student=student,
                defaults={
                    "total_tasks_completed": result_count,
                    "total_points_earned": total_points,
                    "average_score": avg_score,
                    "total_learning_hours": learning_hours,
                    "average_attempts": avg_attempts,
                    "success_rate": success_rate,
                },
            )

    def _seed_analytics_rows(self):
        """Compute TaskStatistics and ModuleStatistics from actual TaskResult data."""
        for task in Task.objects.select_related("module"):
            results = list(task.results.all())
            if not results:
                TaskStatistics.objects.get_or_create(
                    task=task,
                    defaults={
                        "total_submissions": 0,
                        "successful_submissions": 0,
                        "partial_submissions": 0,
                        "failed_submissions": 0,
                        "success_rate": 0.0,
                        "partial_rate": 0.0,
                        "average_attempts": 0.0,
                        "average_score": 0.0,
                    },
                )
                continue

            total = len(results)
            successful = sum(1 for r in results if r.status == "correct")
            partial = sum(1 for r in results if r.status == "partial")
            failed = sum(1 for r in results if r.status == "incorrect")
            avg_attempts = round(sum(r.attempts_count for r in results) / total, 2)
            avg_score = round(sum(r.score for r in results) / total, 1)

            TaskStatistics.objects.update_or_create(
                task=task,
                defaults={
                    "total_submissions": total,
                    "successful_submissions": successful,
                    "partial_submissions": partial,
                    "failed_submissions": failed,
                    "success_rate": round(successful / total * 100, 1),
                    "partial_rate": round(partial / total * 100, 1),
                    "average_attempts": avg_attempts,
                    "average_score": avg_score,
                },
            )

        for module in CourseModule.objects.all():
            progress_qs = list(module.student_progress.all())
            total_started = len(progress_qs)
            completed = sum(1 for p in progress_qs if p.status == "completed")
            avg_completion = round(sum(p.completion_percent for p in progress_qs) / total_started, 1) if total_started else 0.0
            avg_score = round(sum(p.total_score for p in progress_qs) / total_started, 1) if total_started else 0.0

            ModuleStatistics.objects.update_or_create(
                module=module,
                defaults={
                    "total_students_started": total_started,
                    "students_completed": completed,
                    "average_completion_percent": avg_completion,
                    "average_module_score": avg_score,
                },
            )
