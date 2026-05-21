"""
Answer checking module for various task types.

Supports:
- Multiple Choice questions
- Text answers
- Calculation tasks
- AHP (Analytic Hierarchy Process) matrix tasks
- Hierarchy/Diagram building tasks
"""

import json
import math
from typing import Dict, Any, List, Tuple
from numpy import ndarray
import numpy as np
from scipy.linalg import eig


class AnswerChecker:
    """Base class for answer checking."""
    
    TOLERANCE = 0.01  # Default tolerance for numerical comparisons
    
    @staticmethod
    def check_multiple_choice(submitted: Any, reference: Any, **kwargs) -> Dict[str, Any]:
        """Check multiple choice answer."""
        if submitted == reference:
            return {
                'is_correct': True,
                'status': 'correct',
                'score': 100,
                'feedback': 'Correct answer!'
            }
        return {
            'is_correct': False,
            'status': 'incorrect',
            'score': 0,
            'feedback': f'Incorrect. The correct answer is: {reference}'
        }
    
    @staticmethod
    def check_text_answer(submitted: str, reference: str, **kwargs) -> Dict[str, Any]:
        """Check text answer (case-insensitive)."""
        submitted_clean = submitted.strip().lower()
        reference_clean = reference.strip().lower()
        
        if submitted_clean == reference_clean:
            return {
                'is_correct': True,
                'status': 'correct',
                'score': 100,
                'feedback': 'Correct answer!'
            }
        return {
            'is_correct': False,
            'status': 'incorrect',
            'score': 0,
            'feedback': f'Incorrect. The correct answer is: {reference}'
        }
    
    @staticmethod
    def check_calculation(submitted: float, reference: float, tolerance: float = TOLERANCE, **kwargs) -> Dict[str, Any]:
        """Check numerical calculation answer."""
        try:
            submitted_val = float(submitted)
            reference_val = float(reference)
            
            # Check if values are within tolerance
            if abs(submitted_val - reference_val) <= tolerance:
                return {
                    'is_correct': True,
                    'status': 'correct',
                    'score': 100,
                    'feedback': f'Correct! Your answer: {submitted_val}, Expected: {reference_val}'
                }
            else:
                error = abs(submitted_val - reference_val)
                return {
                    'is_correct': False,
                    'status': 'incorrect',
                    'score': 0,
                    'feedback': f'Incorrect. Your answer: {submitted_val}, Expected: {reference_val}, Error: {error:.4f}'
                }
        except (ValueError, TypeError):
            return {
                'is_correct': False,
                'status': 'incorrect',
                'score': 0,
                'feedback': 'Invalid numeric format'
            }


class AHPChecker(AnswerChecker):
    """Checker for Analytic Hierarchy Process (AHP) matrices."""
    
    @staticmethod
    def calculate_priority_vector(matrix: List[List[float]]) -> ndarray:
        """
        Calculate priority vector from pairwise comparison matrix.
        Uses geometric mean method.
        """
        matrix = np.array(matrix, dtype=float)
        n = matrix.shape[0]
        
        # Calculate geometric mean for each row
        priority_vector = np.zeros(n)
        for i in range(n):
            product = 1.0
            for j in range(n):
                product *= matrix[i][j]
            priority_vector[i] = product ** (1.0 / n)
        
        # Normalize
        total = np.sum(priority_vector)
        priority_vector = priority_vector / total
        
        return priority_vector
    
    @staticmethod
    def calculate_consistency_index(matrix: List[List[float]]) -> Tuple[float, float]:
        """
        Calculate Consistency Index (CI) and Consistency Ratio (CR).
        
        Returns:
            Tuple of (CI, CR)
        """
        matrix = np.array(matrix, dtype=float)
        n = matrix.shape[0]
        
        # Priority vector
        priority = AHPChecker.calculate_priority_vector(matrix)
        
        # Calculate lambda max (weighted sum)
        weighted_sum = matrix @ priority
        lambda_max = np.mean(weighted_sum / priority)
        
        # Random Index (RI) values for different matrix sizes
        ri_values = {
            1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32,
            8: 1.41, 9: 1.45, 10: 1.49, 11: 1.51, 12: 1.54, 13: 1.56,
            14: 1.57, 15: 1.58
        }
        
        ri = ri_values.get(n, 1.58)
        
        # Calculate CI and CR
        ci = (lambda_max - n) / (n - 1) if n > 1 else 0
        cr = ci / ri if ri > 0 else 0
        
        return ci, cr
    
    @staticmethod
    def check_ahp_matrix(submitted: Dict[str, Any], reference: Dict[str, Any], 
                         tolerance: float = AnswerChecker.TOLERANCE, **kwargs) -> Dict[str, Any]:
        """
        Check AHP matrix submission.
        
        Submitted and reference should be dictionaries with 'matrix' and optionally 'alternatives'.
        """
        try:
            submitted_matrix = np.array(submitted.get('matrix', []), dtype=float)
            reference_matrix = np.array(reference.get('matrix', []), dtype=float)
            
            n = submitted_matrix.shape[0]
            
            # Validate matrix
            if submitted_matrix.shape != reference_matrix.shape:
                return {
                    'is_correct': False,
                    'status': 'incorrect',
                    'score': 0,
                    'feedback': 'Matrix dimensions do not match'
                }
            
            # Check reciprocal property and diagonal
            for i in range(n):
                for j in range(n):
                    if i == j:
                        # Diagonal should be 1
                        if abs(submitted_matrix[i][j] - 1.0) > tolerance:
                            return {
                                'is_correct': False,
                                'status': 'incorrect',
                                'score': 0,
                                'feedback': f'Diagonal element at [{i}][{j}] should be 1'
                            }
                    else:
                        # Check reciprocal property: a[i][j] * a[j][i] ≈ 1
                        product = submitted_matrix[i][j] * submitted_matrix[j][i]
                        if abs(product - 1.0) > tolerance:
                            return {
                                'is_correct': False,
                                'status': 'incorrect',
                                'score': 0,
                                'feedback': f'Reciprocal property violated at [{i}][{j}]'
                            }
            
            # Calculate priority vectors
            submitted_priority = AHPChecker.calculate_priority_vector(submitted_matrix)
            reference_priority = AHPChecker.calculate_priority_vector(reference_matrix)
            
            # Check priority vectors within tolerance
            priority_match = np.allclose(submitted_priority, reference_priority, atol=tolerance)
            
            # Calculate consistency
            submitted_ci, submitted_cr = AHPChecker.calculate_consistency_index(submitted_matrix)
            reference_ci, reference_cr = AHPChecker.calculate_consistency_index(reference_matrix)
            
            # Check consistency ratio (should be < 0.1)
            consistency_ok = submitted_cr < 0.1
            
            # Determine result
            score = 0
            feedback_parts = []
            
            if not consistency_ok:
                feedback_parts.append(f'Warning: Consistency Ratio = {submitted_cr:.4f} (should be < 0.1)')
            
            if not priority_match:
                feedback_parts.append(
                    f'Priority vectors do not match. '
                    f'Submitted: {submitted_priority}, Reference: {reference_priority}'
                )
                return {
                    'is_correct': False,
                    'status': 'partial' if consistency_ok else 'incorrect',
                    'score': 50 if consistency_ok else 0,
                    'feedback': '\n'.join(feedback_parts)
                }
            
            if not consistency_ok:
                return {
                    'is_correct': False,
                    'status': 'partial',
                    'score': 70,
                    'feedback': f'Consistency Ratio = {submitted_cr:.4f} (should be < 0.1). Priority vectors are correct.'
                }
            
            return {
                'is_correct': True,
                'status': 'correct',
                'score': 100,
                'feedback': f'Correct! CR = {submitted_cr:.4f}, Priority vector calculated correctly.'
            }
        
        except Exception as e:
            return {
                'is_correct': False,
                'status': 'incorrect',
                'score': 0,
                'feedback': f'Error processing matrix: {str(e)}'
            }


class HierarchyChecker(AnswerChecker):
    """Checker for hierarchy/diagram building tasks."""
    
    @staticmethod
    def check_hierarchy(submitted: Dict[str, Any], reference: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Check hierarchy/diagram structure.
        
        Expects dictionaries with 'nodes' and 'edges' structure.
        """
        try:
            submitted_nodes = set(node['id'] for node in submitted.get('nodes', []))
            reference_nodes = set(node['id'] for node in reference.get('nodes', []))
            
            submitted_edges = set(
                tuple(sorted([edge['source'], edge['target']])) 
                for edge in submitted.get('edges', [])
            )
            reference_edges = set(
                tuple(sorted([edge['source'], edge['target']])) 
                for edge in reference.get('edges', [])
            )
            
            # Check if structure matches
            if submitted_nodes != reference_nodes or submitted_edges != reference_edges:
                missing_nodes = reference_nodes - submitted_nodes
                extra_nodes = submitted_nodes - reference_nodes
                missing_edges = reference_edges - submitted_edges
                extra_edges = submitted_edges - reference_edges
                
                feedback_parts = []
                if missing_nodes:
                    feedback_parts.append(f'Missing nodes: {missing_nodes}')
                if extra_nodes:
                    feedback_parts.append(f'Extra nodes: {extra_nodes}')
                if missing_edges:
                    feedback_parts.append(f'Missing connections: {missing_edges}')
                if extra_edges:
                    feedback_parts.append(f'Extra connections: {extra_edges}')
                
                return {
                    'is_correct': False,
                    'status': 'incorrect',
                    'score': 0,
                    'feedback': '\n'.join(feedback_parts)
                }
            
            return {
                'is_correct': True,
                'status': 'correct',
                'score': 100,
                'feedback': 'Hierarchy structure is correct!'
            }
        
        except Exception as e:
            return {
                'is_correct': False,
                'status': 'incorrect',
                'score': 0,
                'feedback': f'Error checking hierarchy: {str(e)}'
            }


def check_answer(task, submitted_answer: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to check answer based on task type.
    
    Args:
        task: Task model instance
        submitted_answer: Submitted answer (dict or converted to dict)
    
    Returns:
        Dictionary with checking result including status, score, feedback
    """
    tolerance = float(task.tolerance) if hasattr(task, 'tolerance') else 0.01
    reference_answer = task.reference_answer if isinstance(task.reference_answer, dict) else json.loads(task.reference_answer)
    
    # Ensure submitted_answer is a dict
    if not isinstance(submitted_answer, dict):
        submitted_answer = {'value': submitted_answer}
    
    result = {
        'status': 'incorrect',
        'score': 0,
        'points_earned': 0,
        'feedback': 'Unknown error'
    }
    
    try:
        if task.task_type == 'multiple_choice':
            check_result = AnswerChecker.check_multiple_choice(
                submitted_answer.get('selected'),
                reference_answer.get('answer')
            )
        
        elif task.task_type == 'text_answer':
            check_result = AnswerChecker.check_text_answer(
                submitted_answer.get('text', ''),
                reference_answer.get('answer', '')
            )
        
        elif task.task_type == 'calculation':
            check_result = AnswerChecker.check_calculation(
                submitted_answer.get('value'),
                reference_answer.get('value'),
                tolerance=tolerance
            )
        
        elif task.task_type == 'matrix':
            check_result = AHPChecker.check_ahp_matrix(
                submitted_answer,
                reference_answer,
                tolerance=tolerance
            )
        
        elif task.task_type == 'hierarchy':
            check_result = HierarchyChecker.check_hierarchy(
                submitted_answer,
                reference_answer
            )
        
        else:
            return result
        
        # Calculate points based on attempts (scoring rules from specification)
        score_multiplier = 1.0
        if hasattr(task, 'current_attempts'):
            attempts = task.current_attempts
            if attempts == 1:
                score_multiplier = 1.0  # 100%
            elif attempts == 2:
                score_multiplier = 0.7  # 70%
            else:  # 3+
                score_multiplier = 0.5  # 50%
        
        # Apply hint penalty
        if submitted_answer.get('is_using_hint', False):
            score_multiplier *= 0.8  # 80%
        
        result['status'] = check_result['status']
        result['score'] = check_result['score']
        result['points_earned'] = int(task.points * (check_result['score'] / 100.0) * score_multiplier)
        result['feedback'] = check_result['feedback']
    
    except Exception as e:
        result['feedback'] = f'Error checking answer: {str(e)}'
    
    return result
