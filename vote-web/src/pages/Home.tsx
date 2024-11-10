import { db } from "fbase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Unsubscribe } from "firebase/auth";
import { useEffect, useState } from "react";

export default function Home() {
  const [voteTeam, setVoteTeam] = useState<any>("");
  const [isVoteStart, setIsVoteStart] = useState<boolean>(false);

  const fetchVoteTeam = async (teamName: string) => {
    const voteQuery = query(
      collection(db, "참가팀"),
      where("name", "==", teamName),
    );

    const unsubscribe = await onSnapshot(voteQuery, (snapshot) => {
      snapshot.docs.map((doc, idx) => {
        console.log(doc.data(), idx, "22222222");
        const { start } = doc.data();

        setVoteTeam(doc.data());
        setIsVoteStart(start);
      });
    });

    return unsubscribe;
  };

  // 데이터 받아와서 세팅
  useEffect(() => {
    let unsubscribeVote: Unsubscribe | null = null;

    const fetchTeamData = async () => {
      unsubscribeVote = await fetchVoteTeam("1팀");
    };

    fetchTeamData();
    // 실시간 감지 이벤트 해제
    return () => {
      unsubscribeVote && unsubscribeVote();
    };
  }, []);

  return (
    <div className="f-c-c-c w-full h-screen bg-red-100">
      <div className="h-20 text-2xl">Home</div>
      {isVoteStart ? (
        <div className="h-20 text-4xl">지금 투표중@@@@@@@@@@@</div>
      ) : null}
    </div>
  );
}
