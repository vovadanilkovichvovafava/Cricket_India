"""ML system — models, training data, ensemble, confidence calibration, learning."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, JSON
from app.core.database import Base


class MLModel(Base):
    """Registered ML models (XGBoost, Claude, ensemble)."""
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # "xgboost_v3", "claude_t20"
    model_type = Column(String(50), nullable=False)  # xgboost, random_forest, claude, ensemble
    version = Column(String(20), nullable=False)  # "1.0", "2.3"
    format_type = Column(String(20), nullable=True)  # t20, odi, test, all

    # Performance metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    total_predictions = Column(Integer, default=0)

    # Storage
    model_path = Column(String(500), nullable=True)  # path to .pkl or .json
    hyperparameters = Column(JSON, nullable=True)  # {max_depth, n_estimators, ...}
    feature_columns = Column(JSON, nullable=True)  # list of feature names

    is_active = Column(Boolean, default=True)  # currently in use
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class MLTrainingData(Base):
    """Training data rows for ML models — historical match features + outcomes."""
    __tablename__ = "ml_training_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), index=True, nullable=False)
    match_type = Column(String(20), nullable=True)  # t20, odi, test

    # Features (JSON — flexible schema for different feature sets)
    features = Column(JSON, nullable=False)  # {home_win_rate, away_form, venue_avg, ...}

    # Labels
    winner = Column(String(100), nullable=True)  # actual winner
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    margin = Column(String(100), nullable=True)  # "5 wickets", "23 runs"

    # Metadata
    series_id = Column(String(50), nullable=True)
    venue = Column(String(200), nullable=True)
    match_date = Column(String(30), nullable=True)
    is_used_for_training = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EnsembleModel(Base):
    """Ensemble model configurations — combining multiple models."""
    __tablename__ = "ensemble_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)  # "cricket_ensemble_v2"
    match_type = Column(String(20), nullable=True)  # t20, odi, test

    # Component models and weights
    components = Column(JSON, nullable=False)  # [{model_id, weight}, ...]
    # e.g. [{"model": "xgboost_v3", "weight": 0.4}, {"model": "claude", "weight": 0.6}]

    # Performance
    accuracy = Column(Float, nullable=True)
    total_predictions = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class ConfidenceCalibration(Base):
    """Confidence calibration data — maps predicted confidence to actual accuracy."""
    __tablename__ = "confidence_calibration"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), index=True, nullable=False)
    match_type = Column(String(20), nullable=True)

    # Calibration bucket
    confidence_bucket = Column(Float, nullable=False)  # 0.5, 0.6, 0.7, 0.8, 0.9
    predicted_pct = Column(Float, nullable=False)  # what model says
    actual_pct = Column(Float, nullable=False)  # what actually happened
    sample_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class LearningLog(Base):
    """Learning log — tracks when ML models were retrained and results."""
    __tablename__ = "learning_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), index=True, nullable=False)
    event_type = Column(String(50), nullable=False)  # training, evaluation, deployment
    match_type = Column(String(20), nullable=True)

    # Training info
    training_samples = Column(Integer, nullable=True)
    features_used = Column(JSON, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    # Results
    accuracy_before = Column(Float, nullable=True)
    accuracy_after = Column(Float, nullable=True)
    metrics = Column(JSON, nullable=True)  # {precision, recall, f1, confusion_matrix}
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LearningPattern(Base):
    """Discovered patterns — factors that strongly affect predictions."""
    __tablename__ = "learning_patterns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pattern_type = Column(String(50), index=True, nullable=False)  # venue, team, player, toss, weather
    match_type = Column(String(20), nullable=True)

    # Pattern description
    name = Column(String(200), nullable=False)  # "CSK at Chepauk in evening matches"
    description = Column(Text, nullable=True)
    conditions = Column(JSON, nullable=True)  # {venue: "Chepauk", time: "evening", team: "CSK"}

    # Impact
    impact_pct = Column(Float, nullable=True)  # how much this shifts win probability
    confidence = Column(Float, nullable=True)
    sample_count = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class LeagueLearning(Base):
    """Per-league/series learning data — IPL-specific patterns and adjustments."""
    __tablename__ = "league_learning"

    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(String(50), index=True, nullable=False)
    series_name = Column(String(200), nullable=True)
    match_type = Column(String(20), nullable=True)

    # League-specific stats
    total_matches = Column(Integer, default=0)
    avg_first_innings_score = Column(Float, nullable=True)
    avg_second_innings_score = Column(Float, nullable=True)
    toss_bat_first_win_pct = Column(Float, nullable=True)
    chase_win_pct = Column(Float, nullable=True)

    # AI performance in this league
    predictions_made = Column(Integer, default=0)
    predictions_correct = Column(Integer, default=0)
    accuracy_pct = Column(Float, nullable=True)

    # Adjustments
    home_advantage_factor = Column(Float, default=1.0)
    pitch_factor = Column(JSON, nullable=True)  # per-venue adjustments

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
