const stories = {
  autoestima: {
    title: 'Baixa autoestima',
    file: 'autoestima.txt',
    theme: 'self-esteem',
  },
  ansiedade: {
    title: 'Ansiedade',
    file: 'ansiedade.txt',
    theme: 'anxiety',
  },
  dismorfiacorporal: {
    title: 'Dismorfia corporal',
    file: 'dismorfiacorporal.txt',
    theme: 'dysmorphia',
  },
  inseguranca: {
    title: 'Inseguranca',
    file: 'inseguranca.txt',
    theme: 'insecurity',
  },
} as const

type StorySlug = keyof typeof stories

export { stories }
export type { StorySlug }
