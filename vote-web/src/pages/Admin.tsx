import { authService, db } from "fbase";
import { Unsubscribe } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ITeams {
  name: string;
  like: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [inputTeamName, setInputTeamName] = useState<string>("");
  const [inputNotice, setInputNotice] = useState<string>("");
  const [teams, setTeams] = useState<ITeams[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [disabledBtn, setDisabledBtn] = useState<boolean>(false);

  // Firebase에서 팀 목록을 가져오는 함수
  const fetchTeams = async () => {
    const teamQuery = query(collection(db, "참가팀"), orderBy("index"));

    const unsubscribe = await onSnapshot(teamQuery, (snapshot) => {
      const teamList: ITeams[] = snapshot.docs.map((doc) => ({
        name: doc.data().name,
        like: doc.data().like,
      }));
      setTeams(teamList);
    });

    return unsubscribe;
  };
  // Firebase에서 팀별 투표목록을 가져오는 함수
  const fetchVotes = async (teamName: string) => {
    const teamRef = collection(db, "참가팀");
    const teamQuery = query(teamRef, where("name", "==", teamName));
    const querySnapshot = await getDocs(teamQuery);

    if (!querySnapshot.empty) {
      const voteDocId = querySnapshot.docs[0].id;
      const voteStatusRef = collection(db, "참가팀", voteDocId, "투표현황");
      const voteSnapshot = await getDocs(voteStatusRef);
      return voteSnapshot.size; // 투표현황의 개수 반환
    }
    return 0;
  };

  // teams 배열의 각 팀의 like를 업데이트하는 함수
  const updateLikesForTeams = async (teamList: ITeams[]) => {
    const updatedTeams = await Promise.all(
      teamList.map(async (team) => {
        const likeCount = await fetchVotes(team.name);
        return { ...team, like: likeCount - 1 };
      }),
    );
    setTeams(updatedTeams); // 상태에 업데이트된 teams를 설정
  };

  // 투표 시작
  const onStartVote = async () => {
    if (disabledBtn) {
      return;
    }
    setDisabledBtn(true);
    const votingRef = collection(db, "투표중");
    const votingQuery = query(votingRef); // 투표중 쿼리
    const querySnapshot = await getDocs(votingQuery);
    // 투표중인 팀 세팅
    try {
      if (querySnapshot.empty) {
        // 투표중인 팀 문서가 없는 경우
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
        setDisabledBtn(false);
        updateLikesForTeams(teams);
      }, 10100);
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
        const newDocRef = await addDoc(teamRef, {
          index: 0 + teams.length,
          name: inputTeamName,
          start: false,
          likeAmount: 0,
        });
        // 투표현황 데이터 세팅
        const voteStatusRef = collection(newDocRef, "투표현황");
        await addDoc(voteStatusRef, {
          nickName: "세팅",
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

          // 1. 하위 컬렉션인 "투표현황"의 모든 문서를 삭제
          const voteStatusRef = collection(docRef, "투표현황");
          const voteStatusSnapshot = await getDocs(voteStatusRef);

          const deletePromises = voteStatusSnapshot.docs.map((voteDoc) =>
            deleteDoc(voteDoc.ref),
          );
          await Promise.all(deletePromises);

          // 2. "참가팀"의 해당 문서 삭제
          await deleteDoc(docRef);

          // 3. 팀 목록에서 삭제된 팀을 제거
          setTeams(teams.filter((team) => team.name !== selectedTeam));
          setSelectedTeam(null); // 삭제 후 선택된 팀 초기화
        }
      } catch (e) {
        console.log("Error deleting team: ", e);
      }
    }
  };

  // 공지사항
  const onChangeNotice = async () => {
    if (inputNotice.trim() === "") {
      return; // 공백만 있는 경우 무시
    }

    try {
      const noticeRef = collection(db, "공지사항");
      const noticeQuery = query(noticeRef); // 참가팀 쿼리
      const querySnapshot = await getDocs(noticeQuery);

      if (querySnapshot.empty) {
        await addDoc(noticeRef, {
          notice: inputNotice,
        });
      } else {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, "공지사항", docId);
        await updateDoc(docRef, {
          notice: inputNotice,
          animation: "",
        });
      }
    } catch (e) {
      console.log("notice error:", e);
    } finally {
      setInputNotice("");
    }
  };

  // 공지사항 animation
  const onChangeAnimation = async (animation: string) => {
    try {
      const noticeRef = collection(db, "공지사항");
      const noticeQuery = query(noticeRef); // 참가팀 쿼리
      const querySnapshot = await getDocs(noticeQuery);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, "공지사항", docId);
        await updateDoc(docRef, {
          animation: animation,
        });
      }
    } catch (e) {
      console.log("animation error:", e);
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

  // 좋아요 업데이트
  useEffect(() => {
    updateLikesForTeams(teams);
  }, []);

  useEffect(() => {
    // 유저가 로그인 여부 체크
    authService.onAuthStateChanged((user) => {
      if (user) {
        console.log("로그인중");
        return;
      } else {
        console.log("로그인 XX");
        navigate("/");
      }
    });
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-screen bg-teal-100">
      <button
        onClick={() => navigate("/")}
        className={`absolute top-2 left-2 px-4 py-1 btn-white`}
      >
        Home
      </button>
      <button
        onClick={async () => await authService.signOut()}
        className={`absolute bottom-2 left-2 px-4 py-1 btn-red-outlined`}
      >
        로그아웃
      </button>
      <div className="f-c-c-c h-35vh">
        <h1 className="mb-5 text-3xl font-bold text-blue-700">팀 관리</h1>
        {/* 팀 버튼들 */}
        <div className="flex flex-wrap w-full max-w-2xl gap-3 p-3 bg-white rounded-lg shadow-md">
          {teams.map((team, index) => (
            <button
              key={index}
              onClick={() => setSelectedTeam(team.name)}
              className={`px-4 py-2 rounded-md f-c-c-c ${
                selectedTeam === team.name ? "bg-red-300" : "bg-sky-300"
              }`}
            >
              {team.name}
              <span className="font-bold">{team.like}</span>
            </button>
          ))}
        </div>
        <div className="h-1/4">
          {/* 삭제 버튼 */}
          {selectedTeam && (
            <button
              onClick={deleteTeam}
              className={`mt-4 px-7 py-2 btn-red-outlined mr-2`}
            >
              삭제
            </button>
          )}
          <button
            onClick={() => {
              updateLikesForTeams(teams);
            }}
            className={`mt-4 px-5 py-2 btn-blue`}
          >
            랭킹 업데이트
          </button>
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
          className="px-4 py-2 text-white transition duration-200 bg-blue-500 rounded-md hover:bg-blue-600"
        >
          팀 추가
        </button>
      </div>
      {selectedTeam && (
        <button
          onClick={onStartVote}
          className={`py-2 my-10  px-7 ${disabledBtn ? "btn-gray" : "btn-dark-blue"}`}
        >
          {disabledBtn ? "투표 중 ㅋ" : "투표 시작"}
        </button>
      )}
      {/* 공지 */}
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChangeNotice();
          }
        }}
        className="flex items-center gap-2 mt-5"
      >
        <input
          type="text"
          value={inputNotice}
          onChange={(e) => setInputNotice(e.target.value)}
          placeholder="공지사항을 입력하세요"
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          onClick={onChangeNotice}
          className="px-4 py-2 text-white transition duration-200 bg-blue-500 rounded-md hover:bg-blue-600"
        >
          공지
        </button>
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => {
            onChangeAnimation("");
          }}
          className={`px-4 py-1 btn-blue-outlined`}
        >
          기본
        </button>
        <button
          onClick={() => {
            onChangeAnimation("animate-jump");
          }}
          className={`px-4 py-1 btn-blue-outlined`}
        >
          점프
        </button>
        <button
          onClick={() => {
            onChangeAnimation("animate-spin");
          }}
          className={`px-4 py-1 btn-blue-outlined`}
        >
          스핀
        </button>
        <button
          onClick={() => {
            onChangeAnimation("animate-ring");
          }}
          className={`px-4 py-1 btn-blue-outlined`}
        >
          흔들
        </button>
        <button
          onClick={() => {
            onChangeAnimation("animate-ping");
          }}
          className={`px-4 py-1 btn-blue-outlined`}
        >
          두근
        </button>
      </div>
    </div>
  );
}
