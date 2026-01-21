import type { Question } from '../types';

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

export async function loadAllQuestions(): Promise<Question[]> {
  const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const allQuestions: Question[] = [];
  
  for (const section of sections) {
    try {
      const [questionsResponse, answersResponse] = await Promise.all([
        fetch(`/questions/1st-step-sections/${section}/questions.csv`),
        fetch(`/questions/1st-step-sections/${section}/answers.csv`)
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
        answers.map(a => [a.id, a.answer === 'true'])
      );
      
      // 「この」を含む問題を除外
      const validQuestions = questions.filter(q => !q.question.includes('この'));
      
      validQuestions.forEach(q => {
        const answer = answersMap.get(q.id);
        if (answer !== undefined) {
          allQuestions.push({
            id: `${section}-${q.id}`,
            question: q.question,
            answer: answer,
            section: section
          });
        }
      });
    } catch (error) {
      console.error(`セクション ${section} の処理中にエラー:`, error);
    }
  }
  
  return allQuestions;
}

export function getRandomQuestion(questions: Question[]): Question | null {
  if (questions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}
