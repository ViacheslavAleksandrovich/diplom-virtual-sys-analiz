from types import SimpleNamespace

from django.test import SimpleTestCase

from .checker import check_answer


class CheckerModuleTests(SimpleTestCase):
    def test_multiple_choice_correct_answer(self):
        task = SimpleNamespace(
            task_type='multiple_choice',
            tolerance=0.01,
            reference_answer={'answer': 'B'},
            points=10,
            current_attempts=1,
        )

        result = check_answer(task, {'selected': 'B'})

        self.assertEqual(result['status'], 'correct')
        self.assertEqual(result['score'], 100)
        self.assertEqual(result['points_earned'], 10)

    def test_calculation_tolerance_applies(self):
        task = SimpleNamespace(
            task_type='calculation',
            tolerance=0.01,
            reference_answer={'value': 2.50},
            points=20,
            current_attempts=2,
        )

        result = check_answer(task, {'value': 2.495})

        self.assertEqual(result['status'], 'correct')
        self.assertEqual(result['score'], 100)
        # second attempt = 70% multiplier
        self.assertEqual(result['points_earned'], 14)

    def test_matrix_invalid_reciprocity_returns_incorrect(self):
        task = SimpleNamespace(
            task_type='matrix',
            tolerance=0.01,
            reference_answer={'matrix': [[1, 2], [0.5, 1]]},
            points=30,
            current_attempts=1,
        )

        result = check_answer(task, {'matrix': [[1, 2], [0.2, 1]]})

        self.assertEqual(result['status'], 'incorrect')
        self.assertEqual(result['score'], 0)
