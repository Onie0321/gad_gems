export const groupResponsesByParticipant = (responses) => {
    const grouped= {};
    responses.forEach(response => {
      if (!grouped[response.userId]) {
        grouped[response.userId] = {
          name: response.name,
          age: response.age,
          sex: response.sex,
          userId: response.userId,
          totalQuestions: 0,
          totalAnswers: 0,
          date: response.$createdAt,
          responses: []
        };
      }
      grouped[response.userId].totalQuestions++;
      if (response.answer) {
        grouped[response.userId].totalAnswers++;
      }
      grouped[response.userId].responses.push(response);
    });
    return Object.values(grouped);
  };
  