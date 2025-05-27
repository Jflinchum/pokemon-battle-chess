import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';

const filter = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const censor = new TextCensor();

export const isStringProfane = (str: string) => {
  return filter.hasMatch(str);
};

export const cleanString = (str: string) => {
  return censor.applyTo(str, filter.getAllMatches(str));
};