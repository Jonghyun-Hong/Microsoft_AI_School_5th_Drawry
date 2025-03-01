// DOM 요소 선택
document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.querySelector(".chat-box");
  const userInput = document.querySelector("#userInput");
  const sendButton = document.querySelector(".send");
  const micButton = document.querySelector(".mic");
  const yesButton = document.querySelector("#yes");
  const rightButton = document.querySelector("#right");
  const finishButton = document.querySelector("#finish");
  const inputarea = document.querySelector(".input-area");
  const nextButton = document.querySelector("#next");

  // 타이핑 인디케이터 설정
  const typingIndicator = document.createElement("div");
  typingIndicator.style.display = "none";
  typingIndicator.classList.add("typing-indicator");
  chatBox.appendChild(typingIndicator);

  // 시스템 프롬프트 설정
  const systemPrompt = {
    role: "system",
    content: `You are an AI assistant that co-creates fairy tales with children aged 6 to 12. 
        Your goal is to help the user build a creative, engaging, and educational story by taking turns, one sentence at a time. 
        You must always speak in **Korean and respond in a friendly, child-appropriate manner.

        📖 **Turn-based Storytelling Rules:**
        - Start the story with a short and *creative introduction if the user hasn't begun.
        - Let the user take a turn, then continue the story based on their input.
        - The assistant and user take turns writing one or two sentences.
        - Refer to retrieved text from RAG data as much as possible, keeping the original context intact.
        - If the user's request extends beyond the RAG data, creatively supplement with original content while ensuring factual consistency.
        - Maintain a child-friendly tone using simple words and short sentences (40-70 words per turn).
        - Avoid scary or overly complex plot lines.
        - Characters should reflect diversity and include relatable aspects for the target audience.
        - If the user uses inappropriate language, respond with a warning message.

        📖 **Turn Limit Rule:**
        - You must gently **ask the user to continue the story unless the user wants to stop by saying that "I will quit it" 
        - **After exactly five turns**, you need to **finish the conversation.
        - After five turns, you MUST not ask the user if they want to continue. And you MUST **summarize and reorganize all exchanged sentences into a structured story without referencing "Beginning," "Development," "Climax," or "Conclusion" labels**

        📖 **Story Finalization Rules:**
        - The final summary must be **a coherent and engaging story**, naturally integrating user inputs while adding necessary elements to complete the narrative.
        - Ensure the completed story has a meaningful or uplifting ending suitable for children.
        - Avoid directly stating "Here is the final story"; instead, present it smoothly as if wrapping up naturally.`,
  };

  // 전역 변수 초기화
  let conversationHistory = [systemPrompt];
  let messageCount = 0;

  // [doc로 시작하는 태그를 제거하는 함수
  function cleanResponse(text) {
    return text.replace(/\[doc[^\]]*\]/g, "");
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
  }

  // 메시지 생성 함수
  function createBubble(text, position, isBot = false) {
    const message = document.createElement("div");
    message.classList.add("chat-message", position);

    if (isBot && position === "left") {
      const icon = document.createElement("img");
      icon.classList.add("icon");
      icon.src = drawryicon;
      message.appendChild(icon);
    }

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.innerHTML = text;

    const tail = document.createElement("div");
    tail.classList.add("tail", position);
    bubble.appendChild(tail);

    message.appendChild(bubble);

    if (isBot && position === "left") {
      // Audio button 추가 및 우측 정렬
      const voiceButton = document.createElement("button");
      voiceButton.textContent = "🎧";
      voiceButton.className = "audio-button";
      message.appendChild(voiceButton); // 버블 오른쪽에 버튼 추가

      voiceButton.addEventListener("pointerdown", () => {
        speakTextWithAzure(text);
        speakTextWithAzure();
      });
    }

    chatBox.appendChild(message);
    scrollToBottom();
  }
  document.querySelector("#userInput").addEventListener("focus", () => {
    scrollToBottom();
  });

  function updateBotResponse(text) {
    const lastBotMessage = chatBox.querySelector(
      ".chat-message.left:last-child"
    );
    if (lastBotMessage) {
      const bubble = lastBotMessage.querySelector(".bubble");
      if (bubble) {
        bubble.innerHTML = text;

        // Audio 버튼이 없으면 추가
        if (!lastBotMessage.querySelector(".audio-button")) {
          const voiceButton = document.createElement("button");
          voiceButton.textContent = "🎧";
          voiceButton.className = "audio-button";

          voiceButton.addEventListener("pointerdown", () => {
            speakTextWithAzure(text);
          });

          lastBotMessage.appendChild(voiceButton); // 버블 바깥 메시지 박스에 추가
        }

        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }
  }

  // AI 응답 처리 함수
  async function handleBotResponse(userMessage, isInitialStory = false) {
    try {
      userInput.disabled = true;
      typingIndicator.style.display = "block";

      let messages = [...conversationHistory];

      if (isInitialStory) {
        // localStorage에서 사용자 선택 가져오기
        const time = localStorage.getItem("time");
        const place = localStorage.getItem("place");
        const action = localStorage.getItem("action");

        // 초기 스토리 생성을 위한 프롬프트 추가
        const storyPrompt = `옛날 옛날에 알라딘이 ${time}에 ${place}에서 ${action}`;

        // messages와 conversationHistory 모두에 추가
        messages.push({ role: "user", content: storyPrompt });
        conversationHistory.push({ role: "user", content: storyPrompt });
      } else {
        messages.push({ role: "user", content: userMessage });
        conversationHistory.push({ role: "user", content: userMessage });
      }

      const response = await fetch(
        `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=${apiVersion}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify({
            messages: messages,
            temperature: 0.8,
            max_tokens: 4000,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: true,
            data_sources: [
              {
                type: "azure_search",
                parameters: {
                  endpoint: searchEndpoint,
                  index_name: searchIndex,
                  semantic_configuration:
                    "vector-index-ver1-semantic-configuration",
                  query_type: "semantic",
                  fields_mapping: {},
                  in_scope: true,
                  role_information: systemPrompt.content,
                  filter: null,
                  strictness: 3,
                  top_n_documents: 20,
                  authentication: {
                    type: "api_key",
                    key: searchKey,
                  },
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API 에러: ${response.status} - ${await response.text()}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";
      createBubble("", "left", true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const jsonData = JSON.parse(line.slice(6));
              const content = jsonData.choices[0].delta?.content;
              if (content) {
                //doc 태그 제거 처리
                const cleadedContent = cleanResponse(content);
                // 전체 응답도 한번 더 정리하여 업데이트
                botResponse += cleadedContent;
                updateBotResponse(cleanResponse(botResponse));
              }
            } catch (error) {
              console.error("JSON 파싱 오류:", error, line);
            }
          }
        }
      }

      // 대화 기록 업데이트
      conversationHistory.push({ role: "assistant", content: botResponse });

      // localStorage 저장 - index 2부터 저장
      if (conversationHistory.length >= 3) {
        const responseIndex = Math.ceil((conversationHistory.length - 2) / 2);
        // 마무리해줘 응답인 경우 강제로 response5로 저장
        if (userMessage === "마무리해줘") {
          localStorage.setItem("storyResponse_5", botResponse);
        } else if (responseIndex <= 4) {
          // 일반 대화는 4번째 응답까지만 저장
          localStorage.setItem(`storyResponse_${responseIndex}`, botResponse);
        }
      }

      if (!isInitialStory) {
        messageCount++;
      }

      // 3턴 완료 후 처리 (response4 저장 직후)
      if (messageCount >= 3 && userMessage !== "마무리해줘") {
        inputarea.style.display = "none";
        finishButton.style.display = "block";
      }

      // 마무리 응답 후 처리
      if (userMessage === "마무리해줘") {
        const allResponses = [];
        for (let i = 1; i <= 5; i++) {
          const response = localStorage.getItem(`storyResponse_${i}`);
          if (response) allResponses.push(response);
        }

        // 모든 응답을 하나의 배열로 저장
        if (allResponses.length > 0) {
          localStorage.setItem(
            "allStoryResponses",
            JSON.stringify(allResponses)
          );
        }

        finishButton.style.display = "none";
        nextButton.style.display = "block";
      }
      setTimeout(() => {
        speakTextWithAzure(botResponse);
      }, 100); // 1초 대기 후 실행

      return botResponse;
    } catch (error) {
      console.error("에러 발생:", error);
      createBubble(`에러가 발생했습니다: ${error.message}`, "left", true);
      return "오류가 발생했습니다.";
    } finally {
      userInput.disabled = false;
      typingIndicator.style.display = "none";
      userInput.focus();
    }
  }

  // 메시지 전송 함수
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    createBubble(text, "right");
    userInput.value = "";

    // AI 응답 처리
    await handleBotResponse(text);
  }

  // 버튼 이벤트 리스너들
  yesButton.addEventListener("pointerdown", () => {
    // localStorage에서 사용자 선택 가져오기
    const nickname = localStorage.getItem("userNickname");
    const time = localStorage.getItem("time");
    const place = localStorage.getItem("place");
    const action = localStorage.getItem("action");

    createBubble("좋아", "right");
    setTimeout(() => {
      createBubble(
        `${nickname} (이)가 선택한 내용은 알라딘이 ${time} / ${place} / ${action}`,
        "left",
        true
      );
    }, 500);
    yesButton.style.display = "none";
    rightButton.style.display = "block";
  });

  rightButton.addEventListener("pointerdown", async () => {
    createBubble("맞아", "right");
    setTimeout(async () => {
      createBubble("그럼 내가 먼저 동화 내용을 만들어 볼게!", "left", true);
      // 초기 스토리 생성
      await handleBotResponse("", true);
      inputarea.style.display = "block";
    }, 500);
    rightButton.style.display = "none";
  });

  finishButton.addEventListener("pointerdown", () => {
    createBubble("마무리해줘", "right");
    handleBotResponse("마무리해줘");
  });

  nextButton.addEventListener("pointerdown", () => {
    window.location.href = "/turtle";
  });

  // 전송 버튼 및 Enter 키 이벤트
  sendButton.addEventListener("pointerdown", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // STT(Speech-to-Text) 기능
  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micButton.addEventListener("pointerdown", () => {
      recognition.start();
    });

    recognition.addEventListener("result", (event) => {
      const speechToText = event.results[0][0].transcript;
      userInput.value = speechToText;
      sendMessage();
    });

    recognition.addEventListener("error", (event) => {
      console.error("음성 인식 오류:", event.error);
    });
  } else {
    micButton.style.display = "none";
  }
});
function getUserNickname() {
  return localStorage.getItem("userNickname") || "로그인해주세요";
}
function updateLibraryTitle() {
  const nickname = getUserNickname();
  const titleElement = document.getElementById("Hello");
  titleElement.textContent = `안녕! 먼저 ${nickname}(이)가 선택한 주인공의 행동을 살펴볼까?`;
}

document.addEventListener("DOMContentLoaded", updateLibraryTitle);
