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
import "./App.scss";

const SECONDS = 10;

export default function Home() {
  // 닉네임 오버레이
  const [isOverlayVisible, setOverlayVisible] = useState<boolean>(false);
  const [voteTeam, setVoteTeam] = useState<any>("");
  const [isVoteStart, setIsVoteStart] = useState<boolean>(false);
  const [seconds, setSeconds] = useState(SECONDS);

  const [nickname, setNickname] = useState<string>("");

  const [heartClicked, setHeartClicked] = useState(false);

  const fetchVoteTeam = async () => {
    const voteQuery = query(collection(db, "투표중"));

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

  // 닉네임 등록
  const handleNicknameSubmit = () => {
    // sessionStorage에 닉네임 저장
    sessionStorage.setItem("nickname", nickname);
    setOverlayVisible(false); // 오버레이 숨기기
  };

  // 데이터 받아와서 세팅
  useEffect(() => {
    let unsubscribeVote: Unsubscribe | null = null;

    const fetchTeamData = async () => {
      unsubscribeVote = await fetchVoteTeam();
    };

    fetchTeamData();
    // 실시간 감지 이벤트 해제
    return () => {
      unsubscribeVote && unsubscribeVote();
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
    // 처음에 sessionStorage에서 닉네임을 확인
    const savedNickname = sessionStorage.getItem("nickname");
    if (!savedNickname) {
      setOverlayVisible(true); // 닉네임이 없으면 오버레이 보이기
    } else {
      setNickname(savedNickname);
    }
  }, []);

  const onClickHeart = () => {
    setHeartClicked((prev) => !prev);
  };

  return (
    <div className="f-c-c-c w-full h-screen bg-gradient-to-r from-blue-300 to-blue-600">
      {/* 오버레이 */}
      {isOverlayVisible && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-85 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-xl font-semibold mb-4">닉네임을 입력하세요</h2>
            <input
              type="text"
              maxLength={7}
              value={nickname || ""}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 mb-4"
            />
            <button
              onClick={handleNicknameSubmit}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
            >
              닉네임 등록
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-0 left-0 right-0 p-5 text-center text-white text-3xl font-bold shadow-md">
        경기창조혁신센터 화이팅
      </div>
      {isVoteStart ? (
        <>
          <div className="text-center -mb-28">
            <div className="text-4xl font-semibold text-white mb-4">
              {voteTeam?.name} 팀
            </div>
            <div className="text-6xl font-extrabold text-yellow-400 mb-6">
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
                    onClick={onClickHeart}
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
                  <style type="text/css">{`.st9{fill:#3b3b3b;}`}</style>
                  <g>
                    <path
                      onClick={onClickHeart}
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
        <div className="text-center text-white text-2xl">
          아직 투표 ㄴㄴ 입니다
        </div>
      )}
    </div>
  );
}
