import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
// 파이어베이스
import { db } from "fbase";
import {
  query,
  orderBy,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

// 컴포넌트
import Message from "./Message";
// import { useAppDispatch } from "Store/hooks";
// import { changeChattingStatus } from "Store/store";
// import { useGetUsersInfoQuery } from "Store/api";

// 시간 옵션
const options = {
  year: "numeric",
  month: "long",
  weekday: "long",
  day: "numeric",
};

interface IChattingProps {
  setOpenChat: React.Dispatch<React.SetStateAction<boolean>>;
}

const Chatting = ({ setOpenChat }: IChattingProps) => {
  const roomName = "채팅";
  // 채팅 div
  const chatDiv = useRef<HTMLDivElement>(null);
  // 유저 프로필 데이터
  const myEmail = localStorage.getItem("nickname");
  const nickname = localStorage.getItem("nickname");
  // 내 이미지 주소

  // 채팅메시지 데이터들
  const [messageDatas, setMessageDatas] = useState<any[]>([]);

  // 채팅 데이터들 가져오기
  const getContents = async () => {
    // 우선 query로 데이터 가져오기 두번째 인자 where로 조건문도 가능
    const content = query(collection(db, roomName), orderBy("createdAt"));

    // 실시간 변화 감지
    onSnapshot(content, (snapshot) => {
      const contentSnapshot = snapshot.docs.map((con) => {
        return {
          ...con.data(),
          id: con.id,
        };
      });
      setMessageDatas((prev) => [...contentSnapshot]);
    });
  };

  // 메시지 데이터
  const [message, setMessage] = useState<string>("");
  const onChangeMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  // 메시지 제출
  const onSubmitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 이미지랑 메시지 빈값일떄 무시
    if (message === "") {
      return;
    }
    // 메시지 데이터에 추가
    await addDoc(collection(db, roomName), {
      type: "text",
      email: myEmail,
      nickname: nickname,
      content: message,
      createdAt: serverTimestamp(),
    });

    setMessage("");
  };

  // 처음 실행하는 곳
  useEffect(() => {
    getContents();
  }, [roomName]);

  useEffect(() => {
    // 채팅 스크롤 젤 밑으로
    setTimeout(() => {
      chatDiv.current!.scrollTop = chatDiv.current!.scrollHeight;
    }, 30);
  }, [messageDatas]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.5,
          ease: "easeInOut",
        }}
        className="flex flex-col justify-center w-full h-full text-white"
      >
        <div className="w-full h-[6%] bg-[#3a103f] flex items-center justify-between px-3">
          <div className="flex items-center h-full text-base font-medium lg:font-semibold lg:text-lg ">
            공개응원방
          </div>
          {/* <img
            onClick={() => {
              // 채팅창끄기
              setOpenChat(false);
            }}
            className={`w-3 h-3 lg:min-w-6 lg:min-h-6 lg:w-6 lg:h-6 cursor-pointer hover:scale-105`}
            src={`${process.env.REACT_APP_S3_URL}/chatting/cancel.png`}
            alt="cancel"
          /> */}
          <div
            onClick={() => {
              // 채팅창끄기
              setOpenChat(false);
            }}
            className={`font-semibold text-lg cursor-pointer hover:scale-105`}
          >
            x
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-full h-[94%] rounded-lg">
          {/* 메시지들 보이는 곳 */}
          <div ref={chatDiv} className="w-[98%] h-full overflow-y-auto">
            {/* 대화 시작 시간 */}
            <div className="flex items-center justify-center w-full my-2 h-fit ">
              <span className="px-5 py-1 text-xs text-center lg:text-base w-fit h-fit bg-[#741f80] rounded-3xl">
                {messageDatas[0]?.createdAt
                  .toDate()
                  .toLocaleDateString("ko-KR", options)}
              </span>
            </div>
            {messageDatas.map((msg, index) => {
              if (index === 0) {
                return <></>;
              }
              // 상대방의 닉네임 처음 한번만
              let checkSameNick = true;
              if (
                index !== 0 &&
                msg.email !== myEmail &&
                msg.email === messageDatas[index - 1].email
              ) {
                checkSameNick = false;
              }
              // 마지막 대화에만 시간뜨게
              let checkLastTime = false;
              if (
                index === messageDatas.length - 1 ||
                (index !== messageDatas.length - 1 &&
                  msg.email !== messageDatas[index + 1].email)
              ) {
                checkLastTime = true;
              }

              // 30초동안 대화안했으면 시간뜨게
              let checkSameTime = true;
              if (
                index !== messageDatas.length - 1 &&
                messageDatas[index + 1].createdAt &&
                msg.createdAt.seconds >=
                  messageDatas[index + 1].createdAt.seconds - 30
              ) {
                checkSameTime = false;
              }

              if (msg.createdAt) {
                // 전날과 같은지 체크
                const prevDate = messageDatas[index - 1].createdAt
                  .toDate()
                  .toLocaleDateString("ko-KR", options);
                const currentDate = msg.createdAt
                  .toDate()
                  .toLocaleDateString("ko-KR", options);
                if (prevDate !== currentDate) {
                  return (
                    <>
                      <div className="flex items-center justify-center w-full my-2 h-fit ">
                        <span className="px-5 py-1 text-xs text-center lg:text-base w-fit h-fit bg-[#741f80] rounded-3xl">
                          {currentDate}
                        </span>
                      </div>
                      <Message
                        key={msg.createdAt}
                        data={msg}
                        myEmail={myEmail}
                        checkSameNick={checkSameNick}
                        checkLastTime={checkLastTime}
                        checkSameTime={checkSameTime}
                      />
                    </>
                  );
                }
              }
              return (
                <Message
                  key={msg.createdAt}
                  data={msg}
                  myEmail={myEmail}
                  checkSameNick={checkSameNick}
                  checkLastTime={checkLastTime}
                  checkSameTime={checkSameTime}
                />
              );
            })}
          </div>
          {/* 메시지 보내는 곳 */}
          <form
            className="flex justify-center w-full my-1 lg:my-6"
            onSubmit={onSubmitMessage}
          >
            <div className="border-[1px] border-[#74203f] rounded-lg w-5/6 flex justify-between items-center px-[0.7rem] py-[0.3rem] ">
              {/* 메시지 입력 */}

              <input
                className={`w-3/4 h-4 lg:h-10 bg-transparent outline-none px-1 lg:px-4 text-black text-xs lg:text-base`}
                type="text"
                placeholder="메시지 보내기..."
                value={message}
                onChange={onChangeMessage}
                maxLength={50}
              />
              {/* 메시지 전송 */}
              <label htmlFor="sendMsg">
                {/* <img
                  className={`w-4 h-4 lg:min-w-9 lg:min-h-8 lg:w-9 lg:h-8 opacity-60 hover:opacity-100 cursor-pointer`}
                  src="/send.png"
                  alt="send"
                /> */}
                <div
                  className="w-4 h-4 bg-no-repeat bg-contain cursor-pointer lg:min-w-9 lg:min-h-8 lg:w-9 lg:h-8 opacity-60 hover:opacity-100 send-icon"
                  aria-label="send"
                ></div>
              </label>
              <input className="hidden" type="submit" id="sendMsg" />
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default Chatting;
