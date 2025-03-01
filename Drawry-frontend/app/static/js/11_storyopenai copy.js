// DOM 요소 선택
document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.querySelector('.chat-box');
    const userInput = document.querySelector('#userInput');
    const sendButton = document.querySelector('.send');
    const micButton = document.querySelector('.mic');
    const yesButton = document.querySelector('#yes');
    const rightButton = document.querySelector('#right');
    const finishButton = document.querySelector('#finish');
    const inputarea = document.querySelector('.input-area');
    const nextButton = document.querySelector('#next');

    // 타이핑 인디케이터 설정
    const typingIndicator = document.createElement('div');
    typingIndicator.textContent = '입력 중...';
    typingIndicator.style.display = 'none';
    typingIndicator.classList.add('typing-indicator');
    chatBox.appendChild(typingIndicator);

    // 시스템 프롬프트 설정
    const systemPrompt = {
        role: "system",
        content: `You are an AI assistant that co-creates fairy tales with children aged 6 to 12. Follow these instructions meticulously: 
                     1. Role and Language:
                        - Engage with children using friendly, simple language appropriate for ages 6 to 12.
                        - All communication must be in Korean.

                    2. Story Progression:
                        - Create the story turn-by-turn, where each turn consists of one or two sentences added by either the user or you.
                        - If the user hasn’t started the story, begin with a short, creative introductory sentence.
                        - Each turn should contain approximately 40–70 words, written in clear and simple sentences.

                    3. Content and Expression Guidelines:
                        - Refer to retrieved text from RAG if possible, keeping the original context intact.
                        - If the user's request extends beyond the RAG data, creatively supplement with original content while ensuring factual consistency.
                        - Develop characters with diverse backgrounds and relatable qualities.
                        - Avoid overly scary or complex plots; the fairy tale should be bright, fun, and engaging.
                        - If the user uses inappropriate language, respond with a gentle warning.

                    4. Turn Limit and Termination:
                        - The conversation is limited to 5 turns (each turn includes one sentence from the user and one from you).
                        - At the end of each turn, gently ask, “Shall we continue the story?” to prompt the next input.
                        - If the user says “I will quit it,” immediately end the conversation and finalize the story.
                        - After the 5th turn, do NOT ask for additional input from the user; instead, integrate all exchanged sentences into a coherent fairy tale.

                    5. Final Story Summary:
                        - After the 5th turn, compile all **exchanged sentences** into a final, coherent, and engaging fairy tale that naturally incorporates all dialogue, including user inputs and any necessary additional content.
                        - Ensure the story has a meaningful, uplifting ending appropriate for children.
                        - Conclude smoothly without explicitly stating phrases like “Here is the final story.`
    };

    // 전역 변수 초기화
    let conversationHistory = [systemPrompt];
    let messageCount = 0;

    // 메시지 생성 함수
    function createBubble(text, position, isBot = false) {
        const message = document.createElement('div');
        message.classList.add('chat-message', position);

        if (isBot && position === 'left') {
            const icon = document.createElement('img');
            icon.classList.add('icon');
            icon.src = "{{ url_for('static', filename='images/main/drawryFace.png') }}";
            message.appendChild(icon);
        }

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerHTML = text;

        const tail = document.createElement('div');
        tail.classList.add('tail', position);
        bubble.appendChild(tail);

        message.appendChild(bubble);
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // AI 응답 업데이트 함수
    function updateBotResponse(text) {
        const lastBotMessage = chatBox.querySelector('.chat-message.left:last-child');
        if (lastBotMessage) {
            const bubble = lastBotMessage.querySelector('.bubble');
            if (bubble) {
                bubble.innerHTML = text;
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    }

    // AI 응답 처리 함수
    async function handleBotResponse(userMessage, isInitialStory = false) {
        try {
            userInput.disabled = true;
            typingIndicator.style.display = 'block';
            
            let messages = [...conversationHistory];
            
            if (isInitialStory) {
                // localStorage에서 사용자 선택 가져오기
                const time = localStorage.getItem('time');
                const place = localStorage.getItem('place');
                const action = localStorage.getItem('action');
                
                // 초기 스토리 생성을 위한 프롬프트 추가
                const storyPrompt = `알라딘이 ${time}에 ${place}에서 ${action}`;
                
                messages.push({ role: 'user', content: storyPrompt });
            } else {
                messages.push({ role: 'user', content: userMessage });
            }

            const response = await fetch(`${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=${apiVersion}`, {               
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify({
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: 4000,
                    top_p: 0.95,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    stream: true,
                    data_sources: [{
                        type: "azure_search",
                        parameters: {
                            endpoint: searchEndpoint,
                            index_name: searchIndex,
                            semantic_configuration: "vector-index-ver1-semantic-configuration",
                            query_type: "semantic",
                            fields_mapping: {},
                            in_scope: true,
                            role_information: systemPrompt.content,
                            filter: null,
                            strictness: 3,
                            top_n_documents: 20,
                            authentication: {
                                type: "api_key",
                                key: searchKey
                            }
                        }
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API 에러: ${response.status} - ${await response.text()}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botResponse = "";
            createBubble("", 'left', true);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const jsonData = JSON.parse(line.slice(6));
                            const content = jsonData.choices[0].delta?.content;
                            if (content) {
                                botResponse += content;
                                updateBotResponse(botResponse);
                            }
                        } catch (error) {
                            console.error('JSON 파싱 오류:', error, line);
                        }
                    }
                }
            }

            // 음성 버튼 추가
            const voiceButton = document.createElement("button");
            voiceButton.textContent = "🎧";
            voiceButton.className = "audio-button";
            let isSpeaking = false;

            voiceButton.addEventListener("click", () => {
                if (isSpeaking) {
                    speechSynthesis.cancel();
                    isSpeaking = false;
                    voiceButton.textContent = "🎧";
                } else {
                    speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(botResponse);
                    utterance.lang = 'ko-KR';
                    speechSynthesis.speak(utterance);
                    isSpeaking = true;
                    voiceButton.textContent = "⬜️";

                    utterance.onend = () => {
                        isSpeaking = false;
                        voiceButton.textContent = "🎧";
                    };
                }
            });

            chatBox.appendChild(voiceButton);

            // 대화 기록 업데이트
            if (!isInitialStory) {
                conversationHistory.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: botResponse }
                );
                messageCount++;
            }
            
            // 5번째 턴 이후 입력창 숨기기 및 마무리 버튼 표시
            if (messageCount >= 5) {
                inputarea.style.display = 'none';
                finishButton.style.display = 'block';
            }

            return botResponse;

        } catch (error) {
            console.error('에러 발생:', error);
            createBubble(`에러가 발생했습니다: ${error.message}`, 'left', true);
            return '오류가 발생했습니다.';
        } finally {
            userInput.disabled = false;
            typingIndicator.style.display = 'none';
            userInput.focus();
        }
    }

    // 메시지 전송 함수
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        createBubble(text, 'right');
        userInput.value = '';

        // AI 응답 처리
        await handleBotResponse(text);
    }

    // 버튼 이벤트 리스너들
    yesButton.addEventListener('click', () => {
        // localStorage에서 사용자 선택 가져오기
        const nickname = localStorage.getItem('userNickname')
        const time = localStorage.getItem('time');
        const place = localStorage.getItem('place');
        const action = localStorage.getItem('action');
        
        createBubble("좋아", 'right');
        setTimeout(() => {
            createBubble(`${nickname} (이)가 선택한 내용은 <br> ${time} / ${place} / ${action}이야.`, 'left', true);
        }, 500);
        yesButton.style.display = 'none';
        rightButton.style.display = 'block';
    });

    rightButton.addEventListener('click', async () => {
        createBubble("맞아", 'right');
        setTimeout(async () => {
            createBubble('그럼 내가 먼저 동화 내용을 만들어볼게!', 'left', true);
            // 초기 스토리 생성
            await handleBotResponse('', true);
            inputarea.style.display = 'block';
        }, 500);
        rightButton.style.display = 'none';
    });

    finishButton.addEventListener('click', () => {
        createBubble("이제 그만할래", 'right');
        handleBotResponse("이제 그만할래");
        finishButton.style.display = 'none';
        nextButton.style.display = 'block';
        inputarea.style.display = 'none';
    });

    nextButton.addEventListener('click', () => {
        window.location.href = "storymakeimage.html";
    });

    // 전송 버튼 및 Enter 키 이벤트
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // STT(Speech-to-Text) 기능
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        micButton.addEventListener('click', () => {
            recognition.start();
        });

        recognition.addEventListener('result', (event) => {
            const speechToText = event.results[0][0].transcript;
            userInput.value = speechToText;
            sendMessage();
        });

        recognition.addEventListener('error', (event) => {
            console.error('음성 인식 오류:', event.error);
        });
    } else {
        micButton.style.display = 'none';
    }
});