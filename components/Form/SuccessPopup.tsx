import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle } from "lucide-react";

interface SuccessPopupProps {
  /**
   * Controls the visibility of the popup
   */
  open: boolean;
  /**
   * Callback function called when the popup should close
   */
  onClose: () => void;
}

const SuccessPopup = ({ open, onClose }: SuccessPopupProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="w-80 p-6 flex flex-col items-center gap-5 bg-white rounded-2xl shadow-lg">
            {/* Close button container */}
            <div className="w-4 h-4 relative" />

            <div className="w-full flex flex-col items-center gap-3">
              {/* Icon container */}
              <div className="w-14 h-14 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              {/* Text content */}
              <div className="flex flex-col items-start gap-2 w-full">
                <h2 className="w-full text-center text-gray-900 text-lg font-semibold font-sans">
                  Submission successful
                </h2>
                <p className="w-full text-center text-gray-500 text-sm font-normal font-sans">
                  The results will take some time to load and will be displayed
                  in the generated record after the loading is complete.
                </p>
              </div>
            </div>

            {/* Button container */}
            <div className="h-16 px-4 pt-2 pb-4 flex flex-col items-center gap-4 w-full">
              <div className="w-full flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="w-full h-10 px-4 bg-blue-500 rounded-xl flex justify-center items-center gap-1.5"
                >
                  <span className="text-center text-white text-sm font-semibold">
                    OK
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SuccessPopup;
