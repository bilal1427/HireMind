"""
Model evaluation for ML pipeline.
"""

import json
from pathlib import Path
from typing import Optional
from datetime import datetime

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)


class ModelEvaluator:
    """Evaluate ML model performance."""

    def evaluate_classification(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        class_names: Optional[list[str]] = None,
    ) -> dict:
        """
        Evaluate classification model.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            class_names: Optional class names

        Returns:
            Evaluation metrics
        """
        metrics = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
            "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
            "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
            "precision_weighted": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
            "recall_weighted": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
            "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        }

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        metrics["confusion_matrix"] = cm.tolist()

        # Per-class metrics
        report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        metrics["per_class_metrics"] = report

        return metrics

    def evaluate_model_performance(
        self,
        model,
        X_test: np.ndarray,
        y_test: np.ndarray,
    ) -> dict:
        """
        Evaluate model on test data.

        Args:
            model: Trained model
            X_test: Test features
            y_test: Test labels

        Returns:
            Evaluation metrics
        """
        y_pred = model.predict(X_test)

        metrics = self.evaluate_classification(y_test, y_pred)

        # Add model info
        metrics["model_type"] = type(model).__name__
        metrics["n_test_samples"] = len(y_test)
        metrics["n_features"] = X_test.shape[1]

        return metrics

    def generate_report(
        self,
        metrics: dict,
        model_name: str = "Model",
    ) -> str:
        """
        Generate a human-readable report.

        Args:
            metrics: Evaluation metrics
            model_name: Name of the model

        Returns:
            Formatted report string
        """
        report = f"""
================================================================================
{model_name} Evaluation Report
================================================================================
Generated: {datetime.utcnow().isoformat()}

Overall Metrics
--------------------------------------------------------------------------------
Accuracy:     {metrics.get('accuracy', 0):.4f}
Precision:    {metrics.get('precision_weighted', 0):.4f} (weighted)
Recall:       {metrics.get('recall_weighted', 0):.4f} (weighted)
F1 Score:     {metrics.get('f1_weighted', 0):.4f} (weighted)

Macro-Averaged Metrics
--------------------------------------------------------------------------------
Precision:    {metrics.get('precision_macro', 0):.4f}
Recall:       {metrics.get('recall_macro', 0):.4f}
F1 Score:     {metrics.get('f1_macro', 0):.4f}
"""

        # Add per-class metrics if available
        if "per_class_metrics" in metrics:
            report += "\nPer-Class Metrics\n--------------------------------------------------------------------------------\n"
            for class_name, class_metrics in metrics["per_class_metrics"].items():
                if isinstance(class_metrics, dict) and "precision" in class_metrics:
                    report += f"{class_name}:\n"
                    report += f"  Precision: {class_metrics.get('precision', 0):.4f}\n"
                    report += f"  Recall:    {class_metrics.get('recall', 0):.4f}\n"
                    report += f"  F1-Score:  {class_metrics.get('f1-score', 0):.4f}\n"
                    report += f"  Support:   {class_metrics.get('support', 0)}\n\n"

        report += "================================================================================\n"

        return report

    def save_evaluation(
        self,
        metrics: dict,
        name: str = "evaluation",
        output_dir: Optional[Path] = None,
    ) -> Path:
        """
        Save evaluation results to file.

        Args:
            metrics: Evaluation metrics
            name: Base name for output file
            output_dir: Output directory

        Returns:
            Path to saved file
        """
        if output_dir is None:
            output_dir = Path(__file__).parent / "artifacts"

        output_dir.mkdir(exist_ok=True)

        output_path = output_dir / f"{name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

        with open(output_path, "w") as f:
            json.dump(metrics, f, indent=2)

        return output_path


def evaluate_model(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    save: bool = False,
) -> dict:
    """
    Convenience function to evaluate a model.

    Args:
        model: Trained model
        X_test: Test features
        y_test: Test labels
        save: Whether to save results

    Returns:
        Evaluation metrics
    """
    evaluator = ModelEvaluator()
    metrics = evaluator.evaluate_model_performance(model, X_test, y_test)

    if save:
        evaluator.save_evaluation(metrics)

    return metrics
