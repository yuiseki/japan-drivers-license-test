import { useState, useEffect } from 'react'
import './App.css'
import type { Question } from './types'
import { loadAllQuestions } from './utils/csvParser'

const TOTAL_QUESTIONS = 50

function App() {
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(false)
  const [userAnswers, setUserAnswers] = useState<boolean[]>([])
  const [showResults, setShowResults] = useState(false)

  const initializeQuiz = async () => {
    setLoading(true)
    const allQuestions = await loadAllQuestions()
    
    // ランダムに50問を選択
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(TOTAL_QUESTIONS, shuffled.length))
    
    setQuizQuestions(selected)
    setCurrentIndex(0)
    setUserAnswers([])
    setAnswered(false)
    setShowResults(false)
    setLoading(false)
  }

  useEffect(() => {
    initializeQuiz()
  }, [])

  const handleAnswer = (answer: boolean) => {
    if (answered) return
    
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
    initializeQuiz()
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
    const passed = percentage >= 90 // 90%以上で合格
    
    return (
      <div className="app-container">
        <header>
          <h1>🚗 運転免許試験クイズ</h1>
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
                    </div>
                  )
                })}
              </div>
            </div>

            <button className="btn btn-restart" onClick={handleReset}>
              もう一度挑戦する
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
        <div className="header-info">
          <div className="progress">
            問題 {currentIndex + 1} / {quizQuestions.length}
          </div>
          <button className="btn-reset" onClick={handleReset}>
            リセット
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
