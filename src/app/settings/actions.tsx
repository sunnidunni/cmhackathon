import { PrepareActionsScreen } from "@/components/prepare-actions/PrepareActionsScreen";
import { onlyWhen } from "@/components/dev/onlyWhen";
import { FIXTURES } from "@/lib/fixtures";

function PrepareActions() {
  return <PrepareActionsScreen />;
}

export default onlyWhen(FIXTURES, PrepareActions);
