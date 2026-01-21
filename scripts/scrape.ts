import { JSDOM } from 'jsdom';

async function main() {
  const questions_csv = ['id,question'];
  const answers_csv = ['id,answer,explain'];

  let question_id = 1;

  for (let i = 1; i <= 4; i++) {
    const q_url = `https://www.takaragaike.co.jp/se_q/chute_q${i.toString().padStart(2, '0')}t.html`;
    const a_url = `https://www.takaragaike.co.jp/se_q/chute_a${i.toString().padStart(2, '0')}.html`;
    const k_url = `https://www.takaragaike.co.jp/se_q/chute_k${i.toString().padStart(2, '0')}.html`;

    const q_res = await fetch(q_url);
    const q_html_sjis = await q_res.arrayBuffer();
    const q_html = new TextDecoder('shift-jis').decode(q_html_sjis);

    const a_res = await fetch(a_url);
    const a_html_sjis = await a_res.arrayBuffer();
    const a_html = new TextDecoder('shift-jis').decode(a_html_sjis);

    const k_res = await fetch(k_url);
    const k_html_sjis = await k_res.arrayBuffer();
    const k_html = new TextDecoder('shift-jis').decode(k_html_sjis);

    const q_dom = new JSDOM(q_html);
    const questions = q_dom.window.document.querySelectorAll('li');

    const a_dom = new JSDOM(a_html);
    const answers = a_dom.window.document.querySelectorAll('td');

    const k_dom = new JSDOM(k_html);
    const explanations = k_dom.window.document.querySelectorAll('li');

    const answer_map = new Map<number, boolean>();
    answers.forEach(td => {
      const text = td.textContent?.trim();
      if (text) {
        const match = text.match(/(\d+)/);
        if (match) {
          const id = parseInt(match[1], 10);
          const answer = text.includes('○');
          answer_map.set(id, answer);
        }
      }
    });

    const explanation_map = new Map<number, string>();
    explanations.forEach(li => {
      const value = li.getAttribute('value');
      if (value) {
        const id = parseInt(value, 10);
        explanation_map.set(id, (li.textContent || '').trim());
      }
    });

    questions.forEach((q) => {
      const question_text = (q.textContent || '').replace(/［.*］/, '').trim();
      if (question_text) {
        const local_id_match = q.innerHTML.match(/<!--([0-9０-９]+)-->/);
        if (local_id_match) {
            const local_id = parseInt(local_id_match[1].replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)), 10);
            const answer = answer_map.get(local_id);
            const explanation = (explanation_map.get(local_id) || '').replace(/"/g, '""');

            questions_csv.push(`${question_id},"${question_text.replace(/"/g, '""')}"`);
            answers_csv.push(`${question_id},${answer},"${explanation}"`);
            question_id++;
        }
      }
    });
  }

  console.log('---QUESTIONS---');
  console.log(questions_csv.join('\n'));
  console.log('---ANSWERS---');
  console.log(answers_csv.join('\n'));
}

main();