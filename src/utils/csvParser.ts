import type { Question, QuizMode } from '../types';

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

export async function loadAllQuestions(mode: QuizMode = 'provisional'): Promise<Question[]> {
  const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const allQuestions: Question[] = [];
  const baseUrl = import.meta.env.BASE_URL;
  
  // 1st-step-sections (仮免許)
  for (const section of sections) {
    try {
      const [questionsResponse, answersResponse] = await Promise.all([
        fetch(`${baseUrl}questions/1st-step-sections/${section}/questions.csv`),
        fetch(`${baseUrl}questions/1st-step-sections/${section}/answers.csv`)
      ]);
      
      if (!questionsResponse.ok || !answersResponse.ok) {
        console.warn(`セクション ${section} の読み込みに失敗しました`);
        continue;
      }
      
      const questionsText = await questionsResponse.text();
      const answersText = await answersResponse.text();
      
      const questions = parseCSV(questionsText);
      const answers = parseCSV(answersText);
      
      // answersをMapに変換
      const answersMap = new Map(
        answers.map(a => [
          a.id,
          {
            answer: a.answer === 'true',
            explain: a.explain?.trim() || undefined
          }
        ])
      );
      
      // 「この」を含む問題を除外
      const validQuestions = questions.filter(q => !q.question.includes('この'));
      
      validQuestions.forEach(q => {
        const answerData = answersMap.get(q.id);
        if (answerData !== undefined) {
          allQuestions.push({
            id: `${section}-${q.id}`,
            question: q.question,
            answer: answerData.answer,
            explain: answerData.explain,
            section: section
          });
        }
      });
    } catch (error) {
      console.error(`セクション ${section} の処理中にエラー:`, error);
    }
  }
  
  // 2nd-step-sections (本免許) - 本免許モードの場合のみ
  if (mode === 'full') {
    for (const section of sections) {
      try {
        const [questionsResponse, answersResponse] = await Promise.all([
          fetch(`${baseUrl}questions/2nd-step-sections/${section}/questions.csv`),
          fetch(`${baseUrl}questions/2nd-step-sections/${section}/answers.csv`)
        ]);
        
        if (!questionsResponse.ok || !answersResponse.ok) {
          console.warn(`2nd-step セクション ${section} の読み込みに失敗しました`);
          continue;
        }
        
        const questionsText = await questionsResponse.text();
        const answersText = await answersResponse.text();
        
        const questions = parseCSV(questionsText);
        const answers = parseCSV(answersText);
        
        // answersをMapに変換
        const answersMap = new Map(
          answers.map(a => [
            a.id,
            {
              answer: a.answer === 'true',
              explain: a.explain?.trim() || undefined
            }
          ])
        );
        
        // 「この」を含む問題を除外
        const validQuestions = questions.filter(q => !q.question.includes('この'));
        
        validQuestions.forEach(q => {
          const answerData = answersMap.get(q.id);
          if (answerData !== undefined) {
            allQuestions.push({
              id: `2nd-${section}-${q.id}`,
              question: q.question,
              answer: answerData.answer,
              explain: answerData.explain,
              section: section + 100 // 2nd-stepは100番台にする
            });
          }
        });
      } catch (error) {
        console.error(`2nd-step セクション ${section} の処理中にエラー:`, error);
      }
    }
  }
  
  return allQuestions;
}

export function getRandomQuestion(questions: Question[]): Question | null {
  if (questions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}
