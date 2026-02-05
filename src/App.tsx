import { useState } from 'react'
import './App.css'
import type { Question, QuizMode } from './types'
import { QUIZ_CONFIG } from './types'
import { loadAllQuestions } from './utils/csvParser'

const REVIEW_STORAGE_KEY = 'driver-license-quiz-review-v1'

type ReviewMap = Record<string, number>

const loadReviewMap = (): ReviewMap => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object') return {}
    const cleaned: ReviewMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        cleaned[key] = value
      }
    }
    return cleaned
  } catch {
    return {}
  }
}

const saveReviewMap = (map: ReviewMap) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(map))
}

function App() {
  const [mode, setMode] = useState<QuizMode>('provisional')
  const [showModeSelect, setShowModeSelect] = useState(true)
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [userAnswers, setUserAnswers] = useState<boolean[]>([])
  const [showResults, setShowResults] = useState(false)

  const initializeQuiz = async (quizMode: QuizMode) => {
    setLoading(true)
    setShowModeSelect(false)
    const allQuestions = await loadAllQuestions(quizMode)
    
    const config = QUIZ_CONFIG[quizMode]
    const reviewMap = loadReviewMap()
    const requiredIds = new Set(
      Object.entries(reviewMap)
        .filter(([, streak]) => streak < 3)
        .map(([id]) => id)
    )
    const requiredQuestions = allQuestions.filter((question) => requiredIds.has(question.id))
    const remaining = allQuestions.filter((question) => !requiredIds.has(question.id))
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)
    const remainingCount = Math.max(config.questionCount - requiredQuestions.length, 0)
    const selected = requiredQuestions.concat(shuffled.slice(0, remainingCount))
    
    setQuizQuestions(selected)
    setCurrentIndex(0)
    setUserAnswers([])
    setAnswered(false)
    setShowResults(false)
    setLoading(false)
  }

  const startQuiz = (selectedMode: QuizMode) => {
    setMode(selectedMode)
    initializeQuiz(selectedMode)
  }

  const updateReviewStatus = (question: Question, isCorrect: boolean) => {
    const reviewMap = loadReviewMap()
    if (isCorrect) {
      const current = reviewMap[question.id]
      if (current !== undefined) {
        const nextStreak = current + 1
        if (nextStreak >= 3) {
          delete reviewMap[question.id]
        } else {
          reviewMap[question.id] = nextStreak
        }
      }
    } else {
      reviewMap[question.id] = 0
    }
    saveReviewMap(reviewMap)
  }

  const handleAnswer = (answer: boolean) => {
    if (answered) return
    
    const currentQuestion = quizQuestions[currentIndex]
    const isCorrect = answer === currentQuestion.answer
    updateReviewStatus(currentQuestion, isCorrect)
    setUserAnswers([...userAnswers, answer])
    setAnswered(true)
  }

  const handleNext = () => {
    if (currentIndex + 1 >= quizQuestions.length) {
      // 最後の問題なので結果画面へ
      setShowResults(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setAnswered(false)
    }
  }

  const handleReset = () => {
    setShowModeSelect(true)
    setQuizQuestions([])
    setCurrentIndex(0)
    setUserAnswers([])
    setAnswered(false)
    setShowResults(false)
  }

  const calculateScore = () => {
    let correct = 0
    quizQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correct++
      }
    })
    return { correct, total: userAnswers.length }
  }

  // モード選択画面
  if (showModeSelect) {
    return (
      <div className="app-container">
        <header>
          <h1>🚗 運転免許試験クイズ</h1>
        </header>
        
        <main className="quiz-container">
          <div className="mode-select-container">
            <h2>モードを選択してください</h2>
            
            <div className="mode-cards">
              <div className="mode-card" onClick={() => startQuiz('provisional')}>
                <div className="mode-icon">🚙</div>
                <h3>{QUIZ_CONFIG.provisional.name}</h3>
                <div className="mode-details">
                  <p>問題数: {QUIZ_CONFIG.provisional.questionCount}問</p>
                  <p>合格ライン: {QUIZ_CONFIG.provisional.passRate}%以上</p>
                  <p className="mode-description">第一段階の問題のみ</p>
                </div>
                <button className="btn btn-start">開始する</button>
              </div>
              
              <div className="mode-card" onClick={() => startQuiz('full')}>
                <div className="mode-icon">🚗</div>
                <h3>{QUIZ_CONFIG.full.name}</h3>
                <div className="mode-details">
                  <p>問題数: {QUIZ_CONFIG.full.questionCount}問</p>
                  <p>合格ライン: {QUIZ_CONFIG.full.passRate}%以上</p>
                  <p className="mode-description">第一段階 + 第二段階の問題</p>
                </div>
                <button className="btn btn-start">開始する</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app-container">
        <h1>運転免許試験クイズ</h1>
        <p>問題を読み込んでいます...</p>
      </div>
    )
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="app-container">
        <h1>運転免許試験クイズ</h1>
        <p>問題の読み込みに失敗しました。</p>
      </div>
    )
  }

  // 結果画面
  if (showResults) {
    const score = calculateScore()
    const percentage = Math.round((score.correct / score.total) * 100)
    const config = QUIZ_CONFIG[mode]
    const passed = percentage >= config.passRate
    
    return (
      <div className="app-container">
        <header>
          <h1>🚗 運転免許試験クイズ</h1>
          <p className="mode-badge">{QUIZ_CONFIG[mode].name}</p>
        </header>
        
        <main className="quiz-container">
          <div className="results-card">
            <h2 className="results-title">結果発表</h2>
            
            <div className={`final-score ${passed ? 'passed' : 'failed'}`}>
              <div className="score-number">{score.correct} / {score.total}</div>
              <div className="score-percentage">{percentage}%</div>
            </div>
            
            <div className={`result-message ${passed ? 'passed' : 'failed'}`}>
              {passed ? (
                <>
                  <span className="result-emoji">🎉</span>
                  <p>合格です！おめでとうございます！</p>
                </>
              ) : (
                <>
                  <span className="result-emoji">📝</span>
                  <p>不合格です。もう一度頑張りましょう！</p>
                </>
              )}
            </div>

            <div className="results-details">
              <h3>回答一覧</h3>
              <div className="answer-list">
                {quizQuestions.map((question, index) => {
                  const userAnswer = userAnswers[index]
                  const isCorrect = userAnswer === question.answer
                  
                  return (
                    <div key={index} className={`answer-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="answer-item-header">
                        <span className="question-number">問題 {index + 1}</span>
                        <span className="answer-result">
                          {isCorrect ? '✓ 正解' : '✗ 不正解'}
                        </span>
                      </div>
                      <div className="answer-item-question">{question.question}</div>
                      <div className="answer-item-answers">
                        <span>あなたの回答: {userAnswer ? '⭕' : '❌'}</span>
                        {!isCorrect && (
                          <span className="correct-ans">正解: {question.answer ? '⭕' : '❌'}</span>
                        )}
                      </div>
                      {!isCorrect && question.explain && (
                        <div className="answer-item-explain">
                          <span className="explain-title">解説:</span>
                          <span className="explain-text">{question.explain}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <button className="btn btn-restart" onClick={handleReset}>
              モード選択に戻る
            </button>
          </div>
        </main>
      </div>
    )
  }

  // クイズ画面
  const currentQuestion = quizQuestions[currentIndex]

  return (
    <div className="app-container">
      <header>
        <h1>🚗 運転免許試験クイズ</h1>
        <p className="mode-badge">{QUIZ_CONFIG[mode].name}</p>
        <div className="header-info">
          <div className="progress">
            問題 {currentIndex + 1} / {quizQuestions.length}
          </div>
          <button className="btn-reset" onClick={handleReset}>
            モード選択に戻る
          </button>
        </div>
      </header>

      <main className="quiz-container">
        <div className="question-card">
          <div className="question-header">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <p className="question-text">{currentQuestion.question}</p>

          {!answered ? (
            <div className="answer-buttons">
              <button 
                className="btn btn-correct"
                onClick={() => handleAnswer(true)}
              >
                ⭕ マル
              </button>
              <button 
                className="btn btn-incorrect"
                onClick={() => handleAnswer(false)}
              >
                ❌ バツ
              </button>
            </div>
          ) : (
            <div className="result-container">
              <div className={`result ${userAnswers[userAnswers.length - 1] === currentQuestion.answer ? 'correct' : 'incorrect'}`}>
                {userAnswers[userAnswers.length - 1] === currentQuestion.answer ? (
                  <div className="result-content">
                    <span className="result-icon">✓</span>
                    <span className="result-text">正解!</span>
                  </div>
                ) : (
                  <div className="result-content">
                    <span className="result-icon">✗</span>
                    <span className="result-text">不正解</span>
                  </div>
                )}
              </div>
              
              <div className="correct-answer">
                正解: {currentQuestion.answer ? '⭕ マル' : '❌ バツ'}
              </div>

              {userAnswers[userAnswers.length - 1] !== currentQuestion.answer && currentQuestion.explain && (
                <div className="explain-card">
                  <div className="explain-title">解説</div>
                  <div className="explain-text">{currentQuestion.explain}</div>
                </div>
              )}

              <button 
                className="btn btn-next"
                onClick={handleNext}
              >
                {currentIndex + 1 >= quizQuestions.length ? '結果を見る' : '次へ →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
