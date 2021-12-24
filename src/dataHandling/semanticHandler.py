
from sentence_transformers import SentenceTransformer, util
import numpy as np


def compareSentences(sentence1,sentence2,themodel='stsb-roberta-large'):
  model = SentenceTransformer(themodel)
  # encode sentences to get their embeddings
  embedding1 = model.encode(sentence1, convert_to_tensor=True)
  embedding2 = model.encode(sentence2, convert_to_tensor=True)
  # compute similarity scores of two embeddings
  cosine_scores = util.pytorch_cos_sim(embedding1, embedding2)
  return cosine_scores.item()

