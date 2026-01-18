import { Progress } from '@/components/ui/progress';
import type { ParseProgress } from '@/utils/workerManager';

interface ParsingProgressProps {
  progress: ParseProgress | null;
  fileSize?: string;
}

export function ParsingProgress({ progress, fileSize }: ParsingProgressProps) {
  const progressPercentage = progress ? (progress.step / progress.total) * 100 : 0;

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Animated spinner */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Progress info */}
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Processing Large JSON
          </h3>
          {fileSize && (
            <p className="text-sm text-muted-foreground">
              File size: {fileSize}
            </p>
          )}
          {progress && (
            <p className="text-sm text-muted-foreground">
              Step {progress.step} of {progress.total}: {progress.message}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progressPercentage)}% complete
          </p>
        </div>

        {/* Additional info */}
        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>Your JSON is being parsed in a background thread.</p>
          <p>The UI will remain responsive during processing.</p>
        </div>
      </div>
    </div>
  );
}
