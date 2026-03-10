import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  problemId: {
    type: Number,
    required: true,
    unique: true
  },

  title: {
    type: String,
    required: true
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true
  },

  description: {
    type: String,
    required: true
  },

  constraints: {
    type: [String]
  },

  tags: {
    type: [String]
  },

  examples: {
    type: [[mongoose.Schema.Types.Mixed]]
  },

  testcases: {
    type: [[mongoose.Schema.Types.Mixed]]
  },

  exampleoutput: {
    type: [mongoose.Schema.Types.Mixed]
  },

  output: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  }
});

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;
