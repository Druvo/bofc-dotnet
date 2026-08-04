import IMatchSchedule from "./IMatchSchedule";
import IPlayer from "./IPlayer";

interface IMatchParticipant {
    id: number;
    matchSchedule: IMatchSchedule;
    player: IPlayer;
    participationStatus: Boolean;
    isActive: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IMatchParticipant;