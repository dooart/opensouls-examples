import { ChatMessageRoleEnum, CortexStep } from "socialagi";
import { MentalProcess } from "soul-engine";
import { prompt } from "./prompt.js";

const userNotes = () => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return prompt`
      Model the mind of ${name}.
      
      ## Description
      Write an updated and clear set of notes on the user that ${name} would want to remember.

      ## Rules
      * Keep descriptions as bullet points
      * Keep relevant bullet points from before
      * Use abbreviated language to keep the notes short
      * Do not write any notes about ${name}

      Please reply with the updated notes on the user:'
  `;
  },
  process: (_step: CortexStep<any>, response: string) => {
    return {
      value: response,
      memories: [
        {
          role: ChatMessageRoleEnum.Assistant,
          content: response,
        },
      ],
    };
  },
});

const plots: MentalProcess = async ({
  step: initialStep,
  subroutine: { useActions, useProcessMemory },
}) => {
  return initialStep;
};

export default plots;
