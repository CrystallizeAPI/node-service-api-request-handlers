export type StateMachineDefinition = {
    states: {
        [key: string]: {
            onEnter?: (subject: any) => void;
            onEntered?: (subject: any) => void;
            onExit?: (subject: any) => void;
            transitions: {
                [key: string]: {
                    to: keyof StateMachineDefinition['states'];
                    action?: (subject: any) => void;
                };
            };
        };
    };
};

export type StateMachine = {
    subject: any;
    transition: (transitionName: string) => void;
    canTransit: (transitionName: string) => boolean;
};
export function createStateMachine(
    subject: any,
    stateProperty: string,
    definition: StateMachineDefinition,
): StateMachine {
    const { states } = definition;

    const actionInfos = (transitionName: string) => {
        const currentState = subject[stateProperty];
        const currentStateDefinition = states[currentState as keyof typeof states];
        const destinationTransition =
            currentStateDefinition.transitions[transitionName as keyof typeof currentStateDefinition.transitions];
        if (!destinationTransition) {
            throw new TransitionError(
                `Cannot find the transition '${transitionName}' on subject with state '${currentState}'.`,
            );
        }
        const destinationState = destinationTransition.to;
        const destinationStateDefinition = states[destinationState as keyof typeof states];
        if (!destinationStateDefinition) {
            throw new TransitionError(
                `Cannot transition to '${destinationState}' from '${currentState}'. It does not exist.`,
            );
        }

        return {
            currentStateDefinition,
            destinationTransition,
            destinationStateDefinition,
            destinationState,
        };
    };

    return {
        subject,
        transition(transitionName: string) {
            const { currentStateDefinition, destinationTransition, destinationStateDefinition, destinationState } =
                actionInfos(transitionName);

            if (destinationTransition.action) {
                destinationTransition.action(subject);
            }
            if (currentStateDefinition.onExit) {
                currentStateDefinition.onExit(subject);
            }
            if (destinationStateDefinition.onEnter) {
                destinationStateDefinition.onEnter(subject);
            }
            subject[stateProperty] = destinationState;
            if (destinationStateDefinition.onEntered) {
                destinationStateDefinition.onEntered(subject);
            }
        },
        canTransit(transitionName: string): boolean {
            try {
                actionInfos(transitionName);
                return true;
            } catch (exception) {
                return false;
            }
        },
    };
}

export class TransitionError extends Error {
    code: number;
    constructor(message: string) {
        super(message);
        this.name = 'TransitionError';
        this.code = 400;
    }
}
