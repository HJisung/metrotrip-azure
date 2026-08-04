import type { Station } from '../../shared/types/station';
import { useTimetableDialog } from './hooks/useTimetableDialog';
import { TimetablePanel } from './ui/TimetablePanel';

type TimetableFeatureProps = {
  station: Station;
  onClose: () => void;
};

export function TimetableFeature({ station, onClose }: TimetableFeatureProps) {
  const timetable = useTimetableDialog(station, onClose);
  return (
    <TimetablePanel
      station={station}
      onClose={onClose}
      direction={timetable.direction}
      onDirectionChange={timetable.setDirection}
      rows={timetable.rows}
      dialogRef={timetable.dialogRef}
      closeButtonRef={timetable.closeButtonRef}
    />
  );
}
