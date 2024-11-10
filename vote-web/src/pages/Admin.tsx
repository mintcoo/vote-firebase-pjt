import { db } from "fbase";
import { Unsubscribe } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Admin() {
  const [inputTeamName, setInputTeamName] = useState("");
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Firebase에서 팀 목록을 가져오는 함수
  const fetchTeams = async () => {
    const teamQuery = query(collection(db, "참가팀"), orderBy("index"));

    const unsubscribe = await onSnapshot(teamQuery, (snapshot) => {
      const teamList: string[] = snapshot.docs.map((doc) => doc.data().name);
      setTeams(teamList);
    });

    return unsubscribe;
  };

  // 투표 시작
  const onStartVote = async () => {
    const votingRef = collection(db, "투표중");
    const votingQuery = query(votingRef); // 투표중 쿼리
    const querySnapshot = await getDocs(votingQuery);
    // 투표중인 팀 세팅
    try {
      if (querySnapshot.empty) {
        // 문서가 없는 경우
        await addDoc(votingRef, {
          start: true,
          name: selectedTeam,
        });
      } else {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, "투표중", docId);
        await updateDoc(docRef, {
          start: true,
          name: selectedTeam,
        });
      }
    } catch (e) {
      console.log("team add error:", e);
    } finally {
      setTimeout(async () => {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, "투표중", docId);
        await updateDoc(docRef, {
          start: false,
        });
      }, 5000);
    }
  };

  // 팀 추가
  const addTeam = async () => {
    if (inputTeamName.trim() === "") {
      return; // 공백만 있는 경우 무시
    }

    try {
      const teamRef = collection(db, "참가팀");
      const teamQuery = query(teamRef, where("name", "==", inputTeamName)); // 참가팀 쿼리
      const querySnapshot = await getDocs(teamQuery);

      if (querySnapshot.empty) {
        // 문서가 없는 경우
        await addDoc(teamRef, {
          index: 0 + teams.length,
          name: inputTeamName,
          start: false,
          likeAmount: 0,
        });
      }
    } catch (e) {
      console.log("team add error:", e);
    } finally {
      setInputTeamName("");
    }
  };

  // 팀 삭제
  const deleteTeam = async () => {
    if (selectedTeam) {
      try {
        const teamRef = collection(db, "참가팀");
        const teamQuery = query(teamRef, where("name", "==", selectedTeam));
        const querySnapshot = await getDocs(teamQuery);

        if (!querySnapshot.empty) {
          const docId = querySnapshot.docs[0].id;
          const docRef = doc(db, "참가팀", docId);

          // Firestore에서 문서 삭제
          await deleteDoc(docRef);
          console.log("Team deleted");

          // 팀 목록에서 삭제된 팀을 제거
          setTeams(teams.filter((team) => team !== selectedTeam));
          setSelectedTeam(null); // 삭제 후 선택된 팀 초기화
        }
      } catch (e) {
        console.log("Error deleting team: ", e);
      }
    }
  };

  // 페이지 로드 시 Firebase에서 팀 목록을 가져와서 세팅
  useEffect(() => {
    let unsubscribeTeams: Unsubscribe | null = null;

    const fetchTeamData = async () => {
      unsubscribeTeams = await fetchTeams();
    };

    fetchTeamData();
    // 실시간 감지 이벤트 해제
    return () => {
      unsubscribeTeams && unsubscribeTeams();
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-screen bg-teal-100">
      <div className="f-c-c-c h-35vh">
        <h1 className="text-3xl font-bold text-blue-700 mb-5">팀 관리</h1>
        {/* 팀 버튼들 */}
        <div className="flex flex-wrap gap-3 p-3 bg-white rounded-lg shadow-md w-full max-w-2xl">
          {teams.map((team, index) => (
            <button
              key={index}
              onClick={() => setSelectedTeam(team)}
              className={`px-4 py-2 rounded-md ${
                selectedTeam === team ? "bg-red-300" : "bg-sky-300"
              }`}
            >
              {team}
            </button>
          ))}
        </div>
        <div className="h-1/4">
          {/* 삭제 버튼 */}
          {selectedTeam && (
            <button
              onClick={deleteTeam}
              className={`mt-4 px-7 py-2 btn-red-outlined`}
            >
              삭제
            </button>
          )}
        </div>
      </div>
      {/* 팀 이름 입력과 추가 버튼 */}
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addTeam();
          }
        }}
        className="flex items-center gap-2 mb-5"
      >
        <input
          type="text"
          value={inputTeamName}
          onChange={(e) => setInputTeamName(e.target.value)}
          placeholder="팀 이름을 입력하세요"
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          onClick={addTeam}
          className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition duration-200"
        >
          팀 추가
        </button>
      </div>
      {selectedTeam && (
        <button onClick={onStartVote} className="btn-dark-blue px-7 py-2 mt-10">
          투표 시작
        </button>
      )}
    </div>
  );
}
