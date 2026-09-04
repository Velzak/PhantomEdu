import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <EmptyState
          title="That page is not in the catalog"
          body="The link is broken or the game slug does not exist. Head back and pick a title from the list."
        />
        <div className="mt-4">
          <ButtonLink href="/">Back to Phantom</ButtonLink>
        </div>
      </div>
    </div>
  );
}
