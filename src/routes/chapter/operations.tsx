import { OperationTeamPanel } from "@/components/team/OperationTeamPanel";
import { ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { useChapterRole } from "@/components/chapter/ChapterGuard";
import { canWriteChapterModule } from "@/lib/chapterRoles";

export default function ChapterOperationsPage() {
  const role = useChapterRole();
  const canWrite = canWriteChapterModule(role, "operations");

  return (
    <div>
      <ChapterPageHeader
        title="Ration Cases Status File"
        description="Chapter ration cases status sheet — Case Number, Family Guardian, City, Rashan Status."
      />
      <OperationTeamPanel canWrite={canWrite} />
    </div>
  );
}
