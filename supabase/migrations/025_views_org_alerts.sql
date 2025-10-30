-- 025_views_org_alerts.sql

create or replace view v_alerts_with_details_org as
select
  a.id as alert_id,
  a.status,
  a.created_at,
  an.type as anomaly_type,
  an.severity,
  an.details,
  c.name as company_name,
  a.org_id
from alerts a
join anomalies an on an.id = a.anomaly_id and an.org_id = a.org_id
left join companies c on c.id = an.company_id and c.org_id = a.org_id;


