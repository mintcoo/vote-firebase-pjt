import { authService, db } from "fbase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Unsubscribe } from "firebase/auth";
import { useEffect, useState } from "react";
import "./App.scss";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Chatting from "components/Chatting";

const SECONDS = 10;

export default function Home() {
  const navigate = useNavigate();
  const nickName = localStorage.getItem("nickname");
  // 닉네임 오버레이
  const [isOverlayVisible, setOverlayVisible] = useState<boolean>(false);
  // 닉네임
  const [inputNickName, setInputNickname] = useState<string>("");
  // 현재 투표진행 중인 팀
  const [voteTeam, setVoteTeam] = useState<any>("");
  // 투표 시작 여부
  const [isVoteStart, setIsVoteStart] = useState<boolean>(false);
  // 카운트다운
  const [seconds, setSeconds] = useState(SECONDS);
  // 투표 클릭 상태
  const [heartClicked, setHeartClicked] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [openChat, setOpenChat] = useState<boolean>(false);
  // 공지사항
  const [notice, setNotice] = useState<string>("");
  // 접속자수
  const [users, setUsers] = useState<number>(0);
  const [animation, setAnimation] = useState<string>("");

  // 실시간 투표 팀
  const fetchVoteTeam = async () => {
    const voteQuery = query(collection(db, "투표중"));

    const unsubscribe = await onSnapshot(voteQuery, (snapshot) => {
      snapshot.docs.map((doc) => {
        const { start } = doc.data();

        setVoteTeam(doc.data());
        setIsVoteStart(start);
      });
    });

    return unsubscribe;
  };
  // 실시간 공지
  const fetchNotice = async () => {
    const noticeQuery = query(collection(db, "공지사항"));

    const unsubscribe = await onSnapshot(noticeQuery, (snapshot) => {
      snapshot.docs.map((doc) => {
        const { notice, animation } = doc.data();
        setNotice(notice);
        setAnimation(animation);
      });
    });

    return unsubscribe;
  };
  // 실시간 접속자
  const fetchOnlineUser = async () => {
    const userQuery = query(collection(db, "접속자"));

    const unsubscribe = await onSnapshot(userQuery, (snapshot) => {
      const userCount = snapshot.size;
      setUsers(userCount);
    });

    return unsubscribe;
  };

  // 닉네임 등록
  const handleNicknameSubmit = () => {
    if (inputNickName !== nickName && nickName !== null) {
      removeUser(nickName);
    }
    // localStorage에 닉네임 저장
    localStorage.setItem("nickname", inputNickName);
    setOverlayVisible(false); // 오버레이 숨기기
  };

  // 유저 접속 추가
  const addUser = async () => {
    const userQuery = query(
      collection(db, "접속자"),
      where("nickName", "==", nickName),
    );

    const querySnapshot = await getDocs(userQuery);

    // 닉네임이 중복되지 않은 경우에만 추가
    if (querySnapshot.empty) {
      await addDoc(collection(db, "접속자"), { nickName: nickName });
    }
  };

  // 유저 접속 제거
  const removeUser = async (nick: string) => {
    const usersQuery = query(
      collection(db, "접속자"),
      where("nickName", "==", nick),
    );
    const querySnapshot = await getDocs(usersQuery);

    querySnapshot.forEach(async (userDoc) => {
      await deleteDoc(doc(db, "접속자", userDoc.id));
    });
  };

  useEffect(() => {
    if (!nickName) return;

    // 접속할 때 유저 추가
    addUser();

    // 창이 닫히거나 새로고침될 때 유저 제거
    const handleBeforeUnload = (event: any) => {
      removeUser(nickName);
      // 브라우저 닫기 막음
      event.preventDefault();
      // 크롬에서 이걸 해야 경고창 나옴
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 컴포넌트 언마운트 시 유저 제거
    return () => {
      removeUser(nickName);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [nickName]);

  // 데이터 받아와서 세팅
  useEffect(() => {
    let unsubscribeVote: Unsubscribe | null = null;
    let unsubscribeNotice: Unsubscribe | null = null;
    let unsubscribeUsers: Unsubscribe | null = null;

    const fetchTeamData = async () => {
      unsubscribeVote = await fetchVoteTeam();
      unsubscribeNotice = await fetchNotice();
      unsubscribeUsers = await fetchOnlineUser();
    };

    fetchTeamData();
    // 실시간 감지 이벤트 해제
    return () => {
      unsubscribeVote && unsubscribeVote();
      unsubscribeNotice && unsubscribeNotice();
      unsubscribeUsers && unsubscribeUsers();
    };
  }, []);

  // 시간초 세팅
  useEffect(() => {
    setSeconds(SECONDS);
    setHeartClicked(false);
    if (!isVoteStart) return;

    const intervalId = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 interval 해제
  }, [isVoteStart]);

  useEffect(() => {
    // 처음에 localStorage에서 닉네임을 확인
    const savedNickname = localStorage.getItem("nickname");
    if (!savedNickname) {
      setOverlayVisible(true);
    } else {
      setInputNickname(savedNickname);
    }
  }, []);

  // 투표하기
  const onClickVote = async () => {
    const teamRef = collection(db, "참가팀");
    const teamQuery = query(teamRef, where("name", "==", voteTeam.name));
    const querySnapshot = await getDocs(teamQuery);

    // 팀 문서가 존재하는지 확인
    if (!querySnapshot.empty) {
      const voteDocId = querySnapshot.docs[0].id;
      const voteStatusRef = collection(db, "참가팀", voteDocId, "투표현황");

      // 닉네임 중복 방지용 쿼리
      const nickNameQuery = query(
        voteStatusRef,
        where("nickName", "==", nickName),
      );
      const nickNameSnapshot = await getDocs(nickNameQuery);

      if (nickNameSnapshot.empty) {
        // 닉네임이 중복되지 않은 경우에만 추가
        await addDoc(voteStatusRef, {
          nickName: nickName,
        });
      } else {
        console.log("이미 투표한 사용자입니다.");
      }
    } else {
      console.log("팀을 찾을 수 없습니다.");
    }
    setHeartClicked(true);
  };

  // 투표취소
  const onClickCancelVote = async () => {
    try {
      const teamRef = collection(db, "참가팀");
      const teamQuery = query(teamRef, where("name", "==", voteTeam.name));
      const querySnapshot = await getDocs(teamQuery);

      if (!querySnapshot.empty) {
        const voteDocId = querySnapshot.docs[0].id;
        const voteStatusRef = collection(db, "참가팀", voteDocId, "투표현황");
        const nickNameQuery = query(
          voteStatusRef,
          where("nickName", "==", nickName),
        );
        const nickNameSnapshot = await getDocs(nickNameQuery);

        if (!nickNameSnapshot.empty) {
          // 일치하는 닉네임을 가진 문서가 있는 경우, 해당 문서 삭제
          const deleteDocId = nickNameSnapshot.docs[0].id;
          const docRef = doc(voteStatusRef, deleteDocId);
          await deleteDoc(docRef);
          console.log("투표 취소 완료");
        } else {
          console.log("투표 기록이 없습니다.");
        }
      } else {
        console.log("해당 팀이 존재하지 않습니다.");
      }
    } catch (e) {
      console.log("Error deleting vote record: ", e);
    }
    setHeartClicked(false);
  };

  useEffect(() => {
    // 유저가 로그인 여부 체크
    authService.onAuthStateChanged((user) => {
      if (user) {
        setIsAdmin(true);
      }
    });
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-custom">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        onClick={() => {
          // 채팅창 닫기
          if (openChat) {
            setOpenChat(false);
          }
        }}
        className="relative z-10 w-full h-screen f-c-c-c"
      >
        {/* // 나중에 막아야함 여기 */}
        {isAdmin ? (
          <>
            <button
              onClick={() => navigate("/admin")}
              className={`absolute bottom-2 right-2 px-4 py-1 btn-red-outlined`}
            >
              Admin
            </button>
            <button
              onClick={() => setOpenChat(true)}
              className={`absolute bottom-12 right-2 px-4 py-1 btn-blue-outlined`}
            >
              Chat
            </button>
          </>
        ) : (
          <button
            onClick={() => setOpenChat(true)}
            className={`absolute bottom-2 right-2 px-4 py-1 btn-blue-outlined`}
          >
            Chat
          </button>
        )}

        {!isVoteStart && (
          <button
            onClick={() => setOverlayVisible(true)}
            className={`absolute bottom-2 left-2 px-4 py-1 btn-dark-blue`}
          >
            닉네임변경
          </button>
        )}

        {/* 오버레이 */}
        {isOverlayVisible && (
          <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-black bg-opacity-85">
            <div className="p-6 bg-white rounded-lg shadow-lg w-80">
              <h2 className="mb-4 text-xl font-semibold">
                닉네임을 입력하세요
              </h2>
              <input
                type="text"
                maxLength={7}
                value={inputNickName || ""}
                onChange={(e) => setInputNickname(e.target.value)}
                placeholder="닉네임 입력"
                className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
              <button
                onClick={handleNicknameSubmit}
                className="w-full px-4 py-2 text-white transition duration-200 bg-blue-500 rounded-md hover:bg-blue-600"
              >
                닉네임 등록
              </button>
            </div>
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 p-5 text-3xl font-bold text-center text-white shadow-md">
          2024 경기센터의 밤
        </div>

        {isAdmin && (
          <div className={`absolute bottom-2 left-auto right-auto text-white`}>
            접속자 : {users}
          </div>
        )}

        {isVoteStart ? (
          <>
            <div className="text-center h-20vh">
              <div className="mb-4 text-4xl font-semibold text-white">
                {voteTeam?.name} 팀
              </div>
              <div className="mb-6 text-6xl font-extrabold text-yellow-400">
                {seconds}초
              </div>
              <div className="text-2xl text-white">투표가 진행 중입니다!</div>
            </div>
            <div className="container">
              {heartClicked ? (
                <>
                  <svg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 269 264"
                    enableBackground="new 0 0 269 264"
                    xmlSpace="preserve"
                    className="animate-bounce"
                  >
                    <style type="text/css">
                      {`
            .st1{fill:#9BB133;}
            .st2{fill:#E7E43B;}
            .st3{fill:#6BABBD;}
            .st4{fill:#38B133;}
            .st5{fill:#E03BE7;}
            .st6{fill:#E9ACC1;}
            .st7{fill:#F04151;}
            .st8{fill:#13414C;}
            .st9{fill:#ffffff;}
            .st10{font-size:23.9043px;}
          `}
                    </style>
                    <g>
                      <path
                        id="Particle"
                        className="st1"
                        d="M84.7,71.5c-4.1-3.6-8.1-3.9-10.1-6.4c-1.2-1.5-1.3-4.2,0.4-5.6s4.6-0.6,5.9,0.5 C83.8,62.3,82.4,67.1,84.7,71.5z"
                      />
                      <path
                        id="Particle_3_"
                        className="st2"
                        d="M100.5,49.6c-2-5.1-5.5-7.1-6.1-10.3c-0.4-1.9,0.7-4.4,2.9-4.8c2.2-0.5,4.4,1.5,5.1,3.1 C103.8,41,100.4,44.6,100.5,49.6z"
                      />
                      <path
                        id="Particle_1_"
                        className="st3"
                        d="M134.9,63.9c0-5.4-2.4-8.6-1.8-11.8c0.4-1.9,2.3-3.8,4.5-3.4c2.2,0.4,3.5,3.1,3.5,4.8 C141.2,57.1,136.7,59.2,134.9,63.9z"
                      />
                      <path
                        id="Particle_2_"
                        className="st4"
                        d="M170.5,47.1c-0.3-3.9-2.9-4.3-2-7.4c0.5-1.8,2.6-3.6,4.8-3s3.2,3.4,3.1,5 C176.1,45.4,172.6,44.1,170.5,47.1z"
                      />
                      <path
                        id="Particle_10_"
                        className="st1"
                        d="M171.7,77.1c3.6-4.1,3.9-8.1,6.4-10.1c1.5-1.2,4.2-1.3,5.6,0.4c1.4,1.7,0.6,4.6-0.5,5.9
    C180.9,76.2,176.1,74.8,171.7,77.1z"
                      />
                      <path
                        id="Particle_4_"
                        className="st5"
                        d="M203.7,86c4.1-3.6,8.1-3.9,10.1-6.4c1.2-1.5,1.3-4.2-0.4-5.6c-1.7-1.4-4.6-0.6-5.9,0.5
    C204.7,76.8,206.1,81.6,203.7,86z"
                      />
                      <path
                        id="Particle_13_"
                        className="st2"
                        d="M221.7,107.9c5.1-2,7.1-5.5,10.3-6.1c1.9-0.4,4.4,0.7,4.8,2.9c0.5,2.2-1.5,4.4-3.1,5.1
    C230.3,111.2,226.7,107.8,221.7,107.9z"
                      />
                      <path
                        id="Particle_11_"
                        className="st3"
                        d="M205,131.4c5.4,0,8.6-2.4,11.8-1.8c1.9,0.4,3.8,2.3,3.4,4.5c-0.4,2.2-3.1,3.5-4.8,3.5
    C211.7,137.6,209.6,133.1,205,131.4z"
                      />
                      <path
                        id="Particle_12_"
                        className="st4"
                        d="M205,169.9c3.9-0.3,4.3-2.9,7.4-2c1.8,0.5,3.6,2.6,3,4.8c-0.6,2.2-3.4,3.2-5,3.1
    C206.6,175.5,208,172,205,169.9z"
                      />
                      <path
                        id="Particle_5_"
                        className="st1"
                        d="M184.6,187.1c4.1,3.6,8.1,3.9,10.1,6.4c1.2,1.5,1.3,4.2-0.4,5.6c-1.7,1.4-4.6,0.6-5.9-0.5
    C185.5,196.3,186.9,191.5,184.6,187.1z"
                      />
                      <path
                        id="Particle_8_"
                        className="st2"
                        d="M155.5,193.1c2,5.1,5.5,7.1,6.1,10.3c0.4,1.9-0.7,4.4-2.9,4.8c-2.2,0.5-4.4-1.5-5.1-3.1
    C152.2,201.7,155.7,198.1,155.5,193.1z"
                      />
                      <path
                        id="Particle_6_"
                        className="st3"
                        d="M129.4,214.1c0,5.4,2.4,8.6,1.8,11.8c-0.4,1.9-2.3,3.8-4.5,3.4c-2.2-0.4-3.5-3.1-3.5-4.8
    C123.1,220.9,127.7,218.8,129.4,214.1z"
                      />
                      <path
                        id="Particle_7_"
                        className="st4"
                        d="M111.3,197.4c0.3,3.9,2.9,4.3,2,7.4c-0.5,1.8-2.6,3.6-4.8,3c-2.2-0.6-3.2-3.4-3.1-5
    C105.8,199.1,109.2,200.4,111.3,197.4z"
                      />
                      <path
                        id="Particle_14_"
                        className="st1"
                        d="M85.6,191.1c-3.6,4.1-3.9,8.1-6.4,10.1c-1.5,1.2-4.2,1.3-5.6-0.4s-0.6-4.6,0.5-5.9
    C76.4,192.1,81.2,193.5,85.6,191.1z"
                      />
                      <path
                        id="Particle_9_"
                        className="st5"
                        d="M73.7,165.1c-4.1,3.6-8.1,3.9-10.1,6.4c-1.2,1.5-1.3,4.2,0.4,5.6c1.7,1.4,4.6,0.6,5.9-0.5
    C72.8,174.3,71.4,169.5,73.7,165.1z"
                      />
                      <path
                        id="Particle_17_"
                        className="st2"
                        d="M55.1,150c-5.1,2-7.1,5.5-10.3,6.1c-1.9,0.4-4.4-0.7-4.8-2.9c-0.5-2.2,1.5-4.4,3.1-5.1
    C46.6,146.7,50.2,150.1,55.1,150z"
                      />
                      <path
                        id="Particle_15_"
                        className="st3"
                        d="M59.4,114.8c-5.4,0-8.6,2.4-11.8,1.8c-1.9-0.4-3.8-2.3-3.4-4.5c0.4-2.2,3.1-3.5,4.8-3.5
    C52.7,108.5,54.8,113.1,59.4,114.8z"
                      />
                      <path
                        id="Particle_16_"
                        className="st4"
                        d="M82.6,93.7c-3.9,0.3-4.3,2.9-7.4,2c-1.8-0.5-3.6-2.6-3-4.8s3.4-3.2,5-3.1
    C81,88.2,79.7,91.6,82.6,93.7z"
                      />
                      {/* Add all other <path> elements here */}
                    </g>
                    <g id="Circle">
                      <circle cx="134.7" cy="131.1" r="52" />
                    </g>

                    <path
                      onClick={onClickCancelVote}
                      id="Heart_2_"
                      className="st7"
                      d="M131.9,110.7c-6.8-6.3-17.4-6-23.7,0.8c-6.3,6.8-6,17.4,0.8,23.7l14.4,13.5l11.5,10.7l11.5-10.7 l14.4-13.5c6.8-6.3,7.1-16.9,0.8-23.7c-6.3-6.8-16.9-7.1-23.7-0.8l-2.9,2.7"
                    />
                  </svg>
                  <div id="Thanks">투표완료</div>{" "}
                </>
              ) : (
                <>
                  <svg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 269 264"
                    enableBackground="new 0 0 269 264"
                    xmlSpace="preserve"
                    className="animate-ring"
                  >
                    <style type="text/css">{`.st9{fill:#a4a4a4;}`}</style>
                    <g>
                      <path
                        onClick={onClickVote}
                        id="Heart_2_"
                        className="st9 "
                        d="M131.9,110.7c-6.8-6.3-17.4-6-23.7,0.8c-6.3,6.8-6,17.4,0.8,23.7l14.4,13.5l11.5,10.7l11.5-10.7 l14.4-13.5c6.8-6.3,7.1-16.9,0.8-23.7c-6.3-6.8-16.9-7.1-23.7-0.8l-2.9,2.7"
                      />
                    </g>
                  </svg>
                </>
              )}
            </div>
          </>
        ) : (
          <div className={`text-3xl text-center text-white ${animation}`}>
            {notice}
          </div>
        )}
      </div>
      {openChat && (
        <AnimatePresence>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ width: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
            className={`fixed bottom-0 right-0 z-50 h-[90vh] flex`}
          >
            <div className="w-full h-full bg-white bg-opacity-95">
              <Chatting setOpenChat={setOpenChat} />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
