-- 일정의 역·장소 순서를 DB에 모두 저장하기 위한 V1.12 마이그레이션
ALTER TABLE travel_plan_items
  ADD COLUMN item_type VARCHAR(10) NOT NULL DEFAULT 'PLACE' AFTER plan_id,
  ADD COLUMN position INT NULL AFTER station_id,
  MODIFY COLUMN place_id BIGINT NULL,
  MODIFY COLUMN visit_time TIME NULL;

UPDATE travel_plan_items target
JOIN (
  SELECT plan_item_id,
         ROW_NUMBER() OVER (PARTITION BY plan_id ORDER BY visit_time, plan_item_id) AS position
  FROM travel_plan_items
) ranked ON ranked.plan_item_id = target.plan_item_id
SET target.position = ranked.position;

ALTER TABLE travel_plan_items
  MODIFY COLUMN position INT NOT NULL,
  ADD CONSTRAINT ck_tpi_item_type CHECK (item_type IN ('STATION', 'PLACE')),
  ADD CONSTRAINT ck_tpi_item_reference CHECK ((item_type = 'STATION' AND station_id IS NOT NULL AND place_id IS NULL) OR (item_type = 'PLACE' AND place_id IS NOT NULL));
