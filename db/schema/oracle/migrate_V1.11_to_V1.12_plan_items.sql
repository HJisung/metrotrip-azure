-- 일정의 역·장소 순서를 DB에 모두 저장하기 위한 V1.12 마이그레이션
ALTER TABLE travel_plan_items ADD (
  item_type VARCHAR2(10 CHAR) DEFAULT 'PLACE' NOT NULL,
  position NUMBER(10)
);

MERGE INTO travel_plan_items target
USING (
  SELECT plan_item_id,
         ROW_NUMBER() OVER (PARTITION BY plan_id ORDER BY visit_time, plan_item_id) AS position
  FROM travel_plan_items
) source
ON (target.plan_item_id = source.plan_item_id)
WHEN MATCHED THEN UPDATE SET target.position = source.position;

ALTER TABLE travel_plan_items MODIFY (
  place_id NULL,
  visit_time NULL,
  position NOT NULL
);

ALTER TABLE travel_plan_items ADD CONSTRAINT ck_tpi_item_type CHECK (item_type IN ('STATION', 'PLACE'));
ALTER TABLE travel_plan_items ADD CONSTRAINT ck_tpi_item_reference CHECK ((item_type = 'STATION' AND station_id IS NOT NULL AND place_id IS NULL) OR (item_type = 'PLACE' AND place_id IS NOT NULL));
