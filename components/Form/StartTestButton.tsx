import { Button } from "@/components/ui/button";
import clsx from "clsx";
import Image from "next/image";

export interface IStartTestButton {
  isSubmitting: boolean;
  disabled?: boolean;
}

const StartTestButton = ({ isSubmitting, disabled }: IStartTestButton) => {
  return (
    <>
      <Button
        type="submit"
        disabled={disabled}
        className={clsx("hover:bg-[#0057B7]", "bg-[#007AFF]")}
      >
        <Image
          src="/GenerateReportLight.svg"
          width={16}
          height={16}
          alt="GenerateReport"
        />
        {isSubmitting ? "Creating" : "Start Test"}
      </Button>
    </>
  );
};

export default StartTestButton;
