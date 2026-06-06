export type DashboardMetrics = {
  primary_metric: string;
  decision_threshold: number;
  failure_recall: number;
  alert_precision: number;
  f1_score: number;
  accuracy: number;
  roc_auc: number;
  pr_auc: number;
  test_loss: number;
  confusion_matrix: number[][];
  dataset_context: {
    failure_rate: number;
    normal_rate: number;
    note: string;
  };
  metric_interpretation: Record<string, string>;
};

export type ThresholdPoint = {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
};

export type TrainingHistory = {
  accuracy: number[];
  loss: number[];
  val_accuracy: number[];
  val_loss: number[];
  roc_auc: number[];
  val_roc_auc: number[];
  pr_auc: number[];
  val_pr_auc: number[];
  precision: number[];
  val_precision: number[];
  recall: number[];
  val_recall: number[];
};

export type TrainingSummary = {
  model_architecture: string;
  training_parameters: {
    epochs: number;
    batch_size: number;
    sequence_length: number;
    class_weight: Record<string, number>;
  };
  dataset_info: {
    training_samples: number;
    testing_samples: number;
    features_per_timestep: number;
    train_class_distribution: {
      normal: number;
      failure: number;
      failure_rate: number;
    };
    test_class_distribution: {
      normal: number;
      failure: number;
      failure_rate: number;
    };
  };
  training_history: TrainingHistory;
  final_evaluation: {
    threshold: number;
    test_loss: number;
    test_accuracy: number;
    test_precision: number;
    test_recall: number;
    test_f1_score: number;
    test_roc_auc: number;
    test_pr_auc: number;
    confusion_matrix: number[][];
    classification_report: Record<string, unknown>;
  };
  recommended_thresholds: {
    best_f1: ThresholdPoint;
    recall_oriented: ThresholdPoint;
  };
};

export type ModelMetricsBundle = {
  dashboard: DashboardMetrics;
  training: TrainingSummary;
  thresholdAnalysis: ThresholdPoint[];
};
