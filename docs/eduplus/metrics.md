# EduPlus – KPIs & Visualizations

## Student-facing metrics
- Overall grade trend: line chart of assignment scores over time (weighted if needed)
- Course GPA / average and median
- Attendance % and streaks (heatmap calendar)
- Assignment completion: on-time vs late ratio
- Notes engagement: edits/week, highlights count (proxy for study time)
- Group contribution: section versions authored, review approvals

## Teacher-facing metrics (course overview)
- Grade distribution: histogram + median/mean
- Completion rate by assignment (bar)
- On-time vs late submission rate (stacked bar)
- Attendance summary: % per session and overall; identify chronic absences
- Trend: moving average of grades across weeks
- At-risk detection: students below threshold (e.g., z-score < -1) or declining trend + low attendance
- Engagement: messages posted, notes shared, views/downloads of resources

## Per-student analytics (within course)
- Trajectory: line chart of grades + moving average
- Relative standing: percentile within course
- Attendance streak and absences
- Submission timeliness: scatter (due vs submittedAt)
- Feedback topics: tags from feedback (future NLP)

## Visual components
- Line (trend), Bar (completion), Histogram (distribution), Heatmap (attendance), Sparkline (quick glance), KPI tiles (big numbers)

## Data freshness
- Real-time for events (attendance, messages)
- Near real-time for heavy aggregates (cache in analyticsCache, recompute on schedule or on demand)

## Privacy & access
- Students see only their own detailed metrics; teachers see aggregates and per-student views for their courses; admins see global aggregates.
