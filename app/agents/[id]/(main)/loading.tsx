import { Sparkles } from "lucide-react";

export default function Loading() {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin">
            <Sparkles className="h-8 w-8 text-taupe mx-auto mb-4" />
          </div>
          <p className="text-gray-600 font-serif">
            Give me a moment—I’m analyzing your data to get things just right.
          </p>
        </div>
      </div>
    );
}
