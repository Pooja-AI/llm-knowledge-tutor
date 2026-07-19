import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ------------------------------------------------------------------ */
/*  Recipe data                                                        */
/* ------------------------------------------------------------------ */

const RECIPES = [
  // ---------------------------------------------------------------- Prompting
  {
    id: "zero-shot-prompting",
    category: "Prompting",
    title: "Zero-Shot Prompting",
    difficulty: "Beginner",
    time: "~10 min",
    description:
      "Ask the model to perform a task directly, with no examples, relying entirely on its pretrained knowledge and instruction-following.",
    tags: ["prompting", "instructions", "baseline"],
    concept: "## Zero-Shot Prompting\n\nZero-shot prompting asks a model to complete a task using only its pretrained\nknowledge and the instruction itself \u2014 no worked examples are provided.\n\n**Why it works:** Large instruction-tuned models have seen millions of\ntask/instruction pairs during training, so they can often generalize to a\nnovel phrasing of a task they've implicitly learned before.\n\n**When to use it**\n- Simple, well-defined tasks (classification, extraction, translation)\n- Rapid prototyping before you've built an example set\n- When token budget is tight and you can't afford example overhead\n\n**Limitations:** Accuracy drops on tasks with unusual output formats, niche\ndomains, or ambiguous instructions. If zero-shot accuracy is inconsistent,\nthat's the signal to move to few-shot prompting.\n",
    steps: [
      { label: "Define Task", icon: "🎯", detail: "State exactly what you want the model to do." },
      { label: "Write Instruction", icon: "✍️", detail: "Phrase it as a direct, unambiguous instruction." },
      { label: "Add Constraints", icon: "📏", detail: "Specify format, length, or tone constraints." },
      { label: "Send Prompt", icon: "📤", detail: "Call the model with no examples included." },
      { label: "Inspect Output", icon: "🔍", detail: "Check whether output matches the requested format." },
    ],
    code: `const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 300,
  messages: [{
    role: "user",
    content: "Classify the sentiment of this review as positive, negative, or neutral. Respond with one word only.\\n\\nReview: 'The battery life is disappointing but the camera is great.'",
  }],
});

console.log(response.content[0].text);`,
  },
  {
    id: "few-shot-prompting",
    category: "Prompting",
    title: "Few-Shot Prompting",
    difficulty: "Beginner",
    time: "~15 min",
    description:
      "Show the model a handful of input/output examples before the real query so it can infer the pattern and format you want.",
    tags: ["prompting", "in-context-learning", "examples"],
    concept: "## Few-Shot Prompting\n\nFew-shot prompting provides a small number of input/output examples directly\nin the prompt, letting the model perform *in-context learning* \u2014 inferring the\ntask pattern from examples rather than an explicit description.\n\n**Key design choices**\n- **Number of examples:** 2\u20138 is typical; more isn't always better; watch for\n  diminishing returns and rising token cost.\n- **Example diversity:** cover edge cases, not just the easy majority class.\n- **Example ordering:** models can be sensitive to order \u2014 recency and\n  primacy effects are real. Put a hard or representative example last.\n- **Consistent formatting:** the delimiter and structure must match exactly\n  between examples and the real query, or the pattern won't transfer.\n\n**When to use it:** Few-shot beats zero-shot whenever the output format is\nnon-obvious (e.g. specific JSON schema, custom labels) or the task requires\nimplicit stylistic conventions that are easier to show than describe.\n",
    steps: [
      { label: "Collect Examples", icon: "🗂️", detail: "Pick 2-8 representative input/output pairs." },
      { label: "Format Consistently", icon: "🧩", detail: "Use the same delimiter and structure for every example." },
      { label: "Order Examples", icon: "🔢", detail: "Put the most similar or hardest example last, closest to the query." },
      { label: "Append Query", icon: "❓", detail: "Add the real input in the same format as the examples." },
      { label: "Generate", icon: "✨", detail: "Model completes the pattern for the new input." },
    ],
    code: `const examples = \`
Text: "I love this phone!"
Sentiment: positive

Text: "Worst purchase ever."
Sentiment: negative

Text: "It's okay, does the job."
Sentiment: neutral
\`;

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 10,
  messages: [{
    role: "user",
    content: \`\${examples}\\nText: "Shipping took forever but support was helpful."\\nSentiment:\`,
  }],
});`,
  },
  {
    id: "chain-of-thought",
    category: "Prompting",
    title: "Chain-of-Thought Prompting",
    difficulty: "Intermediate",
    time: "~15 min",
    description:
      "Instruct the model to reason step by step before giving a final answer, which measurably improves accuracy on arithmetic, logic, and multi-step tasks.",
    tags: ["reasoning", "cot", "prompting"],
    concept: "## Chain-of-Thought (CoT) Prompting\n\nCoT prompting asks the model to produce intermediate reasoning steps before\nits final answer, rather than jumping straight to a conclusion.\n\n**Why it helps:** Autoregressive models generate left-to-right; giving them\n\"thinking space\" lets later tokens condition on earlier reasoning, which\nsubstantially improves performance on arithmetic, symbolic reasoning, and\nmulti-step logic tasks compared to direct answering.\n\n**Two flavors**\n- **Zero-shot CoT:** simply append \"Let's think step by step\" (or similar) to\n  the prompt.\n- **Few-shot CoT:** show worked examples that include the reasoning trace,\n  not just the final answer.\n\n**Practical tips**\n- Ask for the final answer in a separate, parseable tag (e.g. `Answer: <x>`)\n  so you can programmatically extract it from the reasoning trace.\n- CoT increases token usage and latency \u2014 reserve it for problems that\n  actually need multi-step reasoning.\n- The visible reasoning is not guaranteed to reflect the model's true\n  internal computation, so don't treat it as a verified proof, just a useful\n  scaffold.\n",
    steps: [
      { label: "Pose Problem", icon: "🧩", detail: "State the multi-step problem clearly." },
      { label: "Trigger Reasoning", icon: "🧠", detail: "Add 'Think step by step' or similar instruction." },
      { label: "Model Reasons", icon: "📝", detail: "Model writes out intermediate reasoning steps." },
      { label: "Extract Answer", icon: "🎯", detail: "Ask for a final answer tag separate from the reasoning." },
      { label: "Verify", icon: "✅", detail: "Optionally check the reasoning trace for errors." },
    ],
    code: `const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 500,
  messages: [{
    role: "user",
    content: \`A store had 120 apples. It sold 35% on Monday and 20 more on Tuesday.
How many apples are left? Think step by step, then give the final
answer on its own line as "Answer: <number>".\`,
  }],
});`,
  },
  {
    id: "tree-of-thought",
    category: "Prompting",
    title: "Tree-of-Thought",
    difficulty: "Advanced",
    time: "~30 min",
    description:
      "Explore multiple reasoning branches in parallel, evaluate each partial solution, and prune weak branches — useful for planning and search-heavy problems.",
    tags: ["reasoning", "search", "planning"],
    concept: "## Tree-of-Thought (ToT)\n\nTree-of-Thought generalizes chain-of-thought by exploring *multiple*\nreasoning paths as a search tree instead of committing to one linear chain.\nAt each step the model proposes several candidate next-steps, each is\nevaluated, weak branches are pruned, and the best branches are expanded\nfurther.\n\n**Core mechanics**\n1. **Generation:** propose several plausible next thoughts from the current\n   state.\n2. **Evaluation:** score each partial path (self-evaluation, a heuristic, or\n   a separate value model).\n3. **Search strategy:** breadth-first or best-first search over the tree,\n   with a fixed branching factor and depth.\n\n**When it's worth the cost:** ToT trades significantly more inference calls\nfor better solution quality on problems with a large, uncertain search space\n\u2014 puzzle-solving, planning, and creative writing revision are classic\nexamples. For simple factual or arithmetic questions, plain CoT is usually\nsufficient and much cheaper.\n",
    steps: [
      { label: "Generate Branches", icon: "🌿", detail: "Ask the model to propose several distinct next steps." },
      { label: "Expand Each", icon: "🌳", detail: "Continue each branch a few steps forward." },
      { label: "Evaluate Branches", icon: "📊", detail: "Score each partial path for promise (self-evaluation or heuristic)." },
      { label: "Prune", icon: "✂️", detail: "Discard low-scoring branches, keep the top-K." },
      { label: "Select Best Path", icon: "🏆", detail: "Continue expanding the surviving branches to a final answer." },
    ],
    code: `async function scoreBranch(problem, branch) {
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 20,
    messages: [{
      role: "user",
      content: \`Problem: \${problem}\\nPartial solution: \${branch}\\nRate how promising this path is from 1-10. Reply with just the number.\`,
    }],
  });
  return parseInt(res.content[0].text.trim(), 10);
}

async function treeOfThought(problem, breadth = 3, depth = 3) {
  let branches = [""];

  for (let d = 0; d < depth; d++) {
    const expanded = [];
    for (const branch of branches) {
      const res = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: \`Problem: \${problem}\\nSo far: \${branch}\\nPropose \${breadth} distinct next steps, one per line.\`,
        }],
      });
      const nextSteps = res.content[0].text.split("\\n").filter(Boolean);
      for (const step of nextSteps) expanded.push(branch + "\\n" + step);
    }

    const scored = await Promise.all(
      expanded.map(async (b) => ({ branch: b, score: await scoreBranch(problem, b) }))
    );
    branches = scored.sort((a, b) => b.score - a.score).slice(0, breadth).map((s) => s.branch);
  }

  return branches[0];
}`,
  },
  {
    id: "react-prompting",
    category: "Prompting",
    title: "ReAct (Reason + Act)",
    difficulty: "Advanced",
    time: "~25 min",
    description:
      "Interleave reasoning traces with tool actions and observations, letting the model think, act, observe, and repeat until it can answer.",
    tags: ["agents", "tool-use", "reasoning"],
    concept: "## ReAct: Reason + Act\n\nReAct interleaves natural-language *reasoning* traces with concrete *actions*\n(tool calls) and their *observations*, in a repeating Thought \u2192 Action \u2192\nObservation loop. This lets a model gather external information mid-reasoning\ninstead of relying purely on parametric knowledge.\n\n**Why it beats \"reason-then-act\" pipelines:** Because reasoning and acting\nare interleaved, the model can adapt its plan based on what it actually\nobserves \u2014 e.g. abandon a search query that returned nothing, or drill into\nan unexpected result \u2014 rather than committing to a rigid upfront plan.\n\n**Implementation shape**\n- Give the model a set of callable tools.\n- Loop: model emits either a tool call or a final answer.\n- Execute tool calls, append results back into the conversation, repeat.\n- Cap the loop with a max-steps limit to avoid runaway cost.\n\nReAct is the foundational pattern behind most modern tool-using agents.\n",
    steps: [
      { label: "Thought", icon: "🧠", detail: "Model reasons about what it needs to find out next." },
      { label: "Action", icon: "🛠️", detail: "Model selects a tool and issues a call (search, calculator, API)." },
      { label: "Observation", icon: "👁️", detail: "Tool result is appended back into the conversation." },
      { label: "Repeat Loop", icon: "🔄", detail: "Model thinks again given the new observation." },
      { label: "Final Answer", icon: "✨", detail: "Model stops looping and outputs the answer." },
    ],
    code: `async function reactLoop(question, tools, maxSteps = 6) {
  const messages = [{ role: "user", content: question }];

  for (let step = 0; step < maxSteps; step++) {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: res.content });

    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (!toolUse) {
      return res.content.find((b) => b.type === "text")?.text;
    }

    const result = await executeTool(toolUse.name, toolUse.input);
    messages.push({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) }],
    });
  }

  return "Max steps reached without a final answer.";
}`,
  },
  {
    id: "self-consistency",
    category: "Prompting",
    title: "Self-Consistency Decoding",
    difficulty: "Intermediate",
    time: "~20 min",
    description:
      "Sample multiple chain-of-thought completions at higher temperature, then take a majority vote over the final answers to reduce variance.",
    tags: ["reasoning", "sampling", "ensembling"],
    concept: "## Self-Consistency Decoding\n\nSelf-consistency improves the reliability of chain-of-thought reasoning by\nsampling *multiple* independent reasoning paths (at non-zero temperature)\nfor the same question, then taking a majority vote over the final answers\ninstead of trusting a single greedy decode.\n\n**Intuition:** A model can reach the correct answer via more than one valid\nreasoning path, and it can also reach a wrong answer via a single flawed\npath. Sampling many paths and voting cancels out idiosyncratic errors that\ndon't reproduce across samples, while genuinely robust reasoning tends to\nconverge on the same answer repeatedly.\n\n**Trade-offs**\n- Cost scales linearly with the number of samples (`n`) \u2014 typical values are\n  5\u201320.\n- Best suited to tasks with a single verifiable final answer (math, logic,\n  multiple choice) where votes can be cleanly aggregated.\n- Vote share is a cheap, if imperfect, proxy for confidence.\n",
    steps: [
      { label: "Set Temperature", icon: "🌡️", detail: "Use temperature ~0.7-1.0 to get diverse reasoning paths." },
      { label: "Sample N Times", icon: "🎲", detail: "Run the same CoT prompt N times (e.g. N=10) in parallel." },
      { label: "Extract Answers", icon: "🎯", detail: "Parse the final answer out of each completion." },
      { label: "Majority Vote", icon: "🗳️", detail: "Return the most frequent answer across samples." },
      { label: "Report Confidence", icon: "📊", detail: "Use vote share as a rough confidence signal." },
    ],
    code: `async function selfConsistency(prompt, n = 10) {
  const samples = await Promise.all(
    Array.from({ length: n }).map(() =>
      client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 400,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt + '\\nEnd with "Answer: <value>"' }],
      })
    )
  );

  const answers = samples.map((s) => {
    const text = s.content[0].text;
    const match = text.match(/Answer:\\s*(.+)/i);
    return match ? match[1].trim() : null;
  }).filter(Boolean);

  const counts = new Map();
  for (const a of answers) counts.set(a, (counts.get(a) || 0) + 1);

  const [best, votes] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { answer: best, confidence: votes / answers.length };
}`,
  },
  {
    id: "prompt-chaining",
    category: "Prompting",
    title: "Prompt Chaining",
    difficulty: "Intermediate",
    time: "~20 min",
    description:
      "Break a complex task into a sequence of smaller prompts, where each step's output feeds into the next, improving reliability over one giant prompt.",
    tags: ["pipeline", "decomposition", "prompting"],
    concept: "## Prompt Chaining\n\nPrompt chaining decomposes a complex task into a sequence of smaller prompts,\nwhere each step's output becomes part of the next step's input. Rather than\nasking one giant prompt to plan, draft, critique, and polish all at once,\neach sub-task gets its own focused call.\n\n**Why it's more reliable than one mega-prompt**\n- Each individual prompt is simpler and easier for the model to execute well.\n- Intermediate outputs are inspectable and debuggable \u2014 you can see exactly\n  where a chain goes wrong.\n- You can insert validation, human review, or branching logic between steps.\n\n**Common chain shapes**\n- **Draft \u2192 Critique \u2192 Revise:** classic self-improvement loop.\n- **Extract \u2192 Transform \u2192 Generate:** pull structured data out, then use it.\n- **Map \u2192 Reduce:** process many items independently, then synthesize.\n\nThe cost is more round trips and higher latency, so chain only as many steps\nas actually improve reliability.\n",
    steps: [
      { label: "Decompose Task", icon: "✂️", detail: "Split the task into ordered sub-steps." },
      { label: "Draft Step", icon: "📝", detail: "First call produces a rough draft or plan." },
      { label: "Critique Step", icon: "🔍", detail: "Second call reviews the draft for issues." },
      { label: "Revise Step", icon: "🔧", detail: "Third call rewrites using the critique as feedback." },
      { label: "Final Output", icon: "✨", detail: "Return the polished result to the user." },
    ],
    code: `async function draftCritiqueRevise(topic) {
  const draft = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    messages: [{ role: "user", content: \`Write a short draft blog intro about: \${topic}\` }],
  });

  const critique = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: \`Critique this draft for clarity and hook strength:\\n\\n\${draft.content[0].text}\`,
    }],
  });

  const final = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: \`Revise the draft using this critique.\\n\\nDraft:\\n\${draft.content[0].text}\\n\\nCritique:\\n\${critique.content[0].text}\`,
    }],
  });

  return final.content[0].text;
}`,
  },
  {
    id: "least-to-most",
    category: "Prompting",
    title: "Least-to-Most Prompting",
    difficulty: "Advanced",
    time: "~25 min",
    description:
      "Decompose a hard problem into an ordered list of easier sub-problems, then solve them sequentially, feeding each solved sub-problem forward as context.",
    tags: ["reasoning", "decomposition", "compositional"],
    concept: "## Least-to-Most Prompting\n\nLeast-to-most prompting decomposes a hard problem into an *ordered* sequence\nof sub-problems, from simplest to most complex, and solves them one at a\ntime \u2014 carrying forward each solved sub-problem as context for the next.\n\n**How it differs from chain-of-thought:** CoT reasons within a single\ngeneration. Least-to-most makes the decomposition explicit and *external*:\neach sub-problem gets its own model call, and earlier answers become\ngrounding context for later, harder sub-problems. This is especially\neffective for *compositional generalization* \u2014 problems that require\ncombining several learned skills in a novel way.\n\n**Typical use cases:** multi-step math word problems, compositional\ninstruction following, and tasks where a single hard question can be\nmechanically broken into a chain of easier ones (e.g. \"compute X\" \u2192 \"use X\nto compute Y\" \u2192 \"use Y to answer the original question\").\n",
    steps: [
      { label: "Decompose", icon: "🧩", detail: "Ask the model to list sub-problems from easiest to hardest." },
      { label: "Solve First", icon: "1️⃣", detail: "Solve the simplest sub-problem alone." },
      { label: "Carry Context", icon: "➡️", detail: "Append the solved sub-problem to context for the next one." },
      { label: "Iterate", icon: "🔄", detail: "Repeat solve-and-carry for every remaining sub-problem." },
      { label: "Final Solve", icon: "✨", detail: "Solve the original question using all prior sub-answers." },
    ],
    code: `async function leastToMost(question) {
  const decomp = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [{ role: "user", content: \`List the sub-questions needed to answer, from easiest to hardest, one per line:\\n\${question}\` }],
  });

  const subQuestions = decomp.content[0].text.split("\\n").filter(Boolean);

  let context = "";
  for (const sq of subQuestions) {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      messages: [{ role: "user", content: \`\${context}\\nQuestion: \${sq}\\nAnswer:\` }],
    });
    context += \`\\nQ: \${sq}\\nA: \${res.content[0].text}\`;
  }

  const final = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 400,
    messages: [{ role: "user", content: \`\${context}\\n\\nUsing the above, answer: \${question}\` }],
  });

  return final.content[0].text;
}`,
  },

  // ---------------------------------------------------------------- Fine-Tuning
  {
    id: "sft",
    category: "Fine-Tuning",
    title: "Supervised Fine-Tuning (SFT)",
    difficulty: "Intermediate",
    time: "~45 min",
    description:
      "Adapt a pretrained base model to a target task or style by training on a labeled dataset of prompt/completion pairs.",
    tags: ["fine-tuning", "sft", "training"],
    concept: "## Supervised Fine-Tuning (SFT)\n\nSFT adapts a pretrained base model to a target task, domain, or style by\ncontinuing training on a labeled dataset of prompt/completion pairs, using\nstandard next-token-prediction cross-entropy loss.\n\n**Where SFT sits in the training pipeline:** base pretraining teaches broad\nlanguage modeling; SFT is typically the *first* alignment step, teaching the\nmodel to follow instructions and adopt a desired response format, before any\npreference-based methods (RLHF, DPO) are applied on top.\n\n**Key practical considerations**\n- **Data quality > data quantity.** A few thousand carefully curated examples\n  often outperform a noisy dataset ten times larger.\n- **Small learning rate, few epochs.** Overtraining on a small SFT set causes\n  the model to forget general capabilities (catastrophic forgetting).\n- **Held-out evaluation** is essential \u2014 track both task-specific metrics and\n  general capability regressions.\n\nSFT is the baseline every other fine-tuning method (LoRA, RLHF, DPO) either\nfollows or replaces part of.\n",
    steps: [
      { label: "Collect Data", icon: "🗂️", detail: "Gather high-quality prompt/completion pairs for the target task." },
      { label: "Clean & Dedup", icon: "🧹", detail: "Remove duplicates, PII, and low-quality examples." },
      { label: "Format Dataset", icon: "📋", detail: "Convert to the trainer's expected JSONL chat format." },
      { label: "Train", icon: "🏋️", detail: "Run supervised training with a small learning rate for a few epochs." },
      { label: "Evaluate", icon: "📊", detail: "Compare fine-tuned vs base model on held-out examples." },
      { label: "Deploy", icon: "🚀", detail: "Serve the fine-tuned checkpoint behind your inference endpoint." },
    ],
    code: `from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from datasets import load_dataset

model_name = "base-model-7b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

dataset = load_dataset("json", data_files="sft_data.jsonl")["train"]

def format_example(ex):
    text = f"### Instruction:\\n{ex['prompt']}\\n\\n### Response:\\n{ex['completion']}"
    return tokenizer(text, truncation=True, max_length=1024)

tokenized = dataset.map(format_example, remove_columns=dataset.column_names)

args = TrainingArguments(
    output_dir="./sft-checkpoint",
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    num_train_epochs=3,
    learning_rate=2e-5,
    warmup_ratio=0.03,
    logging_steps=10,
    save_strategy="epoch",
)

trainer = Trainer(model=model, args=args, train_dataset=tokenized)
trainer.train()`,
  },
  {
    id: "lora-fine-tuning",
    category: "Fine-Tuning",
    title: "LoRA Fine-Tuning",
    difficulty: "Advanced",
    time: "~40 min",
    description:
      "Freeze the base model and train small low-rank adapter matrices instead, cutting trainable parameters and GPU memory by orders of magnitude.",
    tags: ["lora", "peft", "efficient-training"],
    concept: "## LoRA (Low-Rank Adaptation)\n\nLoRA freezes the pretrained model's weights entirely and instead injects\nsmall trainable low-rank matrices (A and B) alongside select weight\nmatrices \u2014 typically the attention projections. Only these adapter matrices\nare updated during training.\n\n**Why it's efficient:** A weight update `\u0394W` is approximated as `B\u00b7A` where\n`B` and `A` are much smaller than the original matrix (rank `r` is often\n8\u201364 versus a hidden dimension in the thousands). This cuts trainable\nparameters \u2014 and therefore optimizer memory \u2014 by 100\u20131000x compared to full\nfine-tuning.\n\n**Practical benefits**\n- Fine-tune large models on a single GPU that couldn't fit full fine-tuning.\n- Store many small adapters (megabytes each) instead of many full model\n  copies, and swap them per task at inference time.\n- Merge the adapter into the base weights for zero-overhead serving, or keep\n  it separate for flexibility.\n\n**Trade-off:** LoRA slightly underperforms full fine-tuning on tasks\nrequiring large representational shifts, but matches it closely for most\ninstruction-following and domain-adaptation use cases.\n",
    steps: [
      { label: "Load Base Model", icon: "📦", detail: "Load the pretrained model in half precision, frozen." },
      { label: "Inject Adapters", icon: "🔌", detail: "Attach low-rank A/B matrices to attention projection layers." },
      { label: "Freeze Base Weights", icon: "🧊", detail: "Only adapter parameters remain trainable." },
      { label: "Train Adapters", icon: "🏋️", detail: "Fine-tune on task data — a fraction of full-model compute." },
      { label: "Merge or Serve", icon: "🔗", detail: "Merge adapters into base weights, or keep them swappable at inference." },
    ],
    code: `from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("base-model-7b", torch_dtype="bfloat16")

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 0.06% of total

# Train with the standard Trainer, then either:
model.save_pretrained("./lora-adapter")          # keep adapter separate
# or
merged = model.merge_and_unload()                 # bake adapter into base weights`,
  },
  {
    id: "qlora",
    category: "Fine-Tuning",
    title: "QLoRA (Quantized LoRA)",
    difficulty: "Advanced",
    time: "~40 min",
    description:
      "Combine 4-bit quantization of the frozen base model with LoRA adapters, making it possible to fine-tune large models on a single consumer GPU.",
    tags: ["qlora", "quantization", "efficient-training"],
    concept: "## QLoRA (Quantized LoRA)\n\nQLoRA combines two ideas: quantizing the frozen base model to 4-bit\nprecision (NF4, a data type tuned for normally-distributed weights) *and*\ntraining LoRA adapters on top in higher precision (bfloat16). Gradients flow\nthrough the quantized weights into the small adapter matrices, which remain\nthe only trainable parameters.\n\n**Why it matters:** it makes fine-tuning genuinely large models (13B\u201370B+)\nfeasible on a single consumer or prosumer GPU by cutting the base model's\nmemory footprint by ~4x compared to fp16, while LoRA already cuts trainable\nparameter count dramatically.\n\n**Extra tricks that make it work well**\n- **Double quantization:** quantize the quantization constants themselves for\n  additional memory savings.\n- **Paged optimizers:** offload optimizer state to CPU memory during memory\n  spikes to avoid out-of-memory crashes.\n\nQLoRA showed that 4-bit base model quality loss, when paired with LoRA\nadapters, is small enough that fine-tuned results are close to full-precision\nfine-tuning \u2014 a major unlock for accessible fine-tuning.\n",
    steps: [
      { label: "Quantize Base Model", icon: "🗜️", detail: "Load base weights in 4-bit NF4 precision." },
      { label: "Add Adapters", icon: "🔌", detail: "Attach LoRA adapters on top of the quantized model." },
      { label: "Double Quantization", icon: "🔁", detail: "Quantize the quantization constants themselves to save more memory." },
      { label: "Train", icon: "🏋️", detail: "Backprop through quantized weights into the bf16 adapters." },
      { label: "Dequantize for Serving", icon: "📦", detail: "Merge adapters and optionally re-quantize for deployment." },
    ],
    code: `from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype="bfloat16",
)

model = AutoModelForCausalLM.from_pretrained(
    "base-model-13b",
    quantization_config=bnb_config,
    device_map="auto",
)

model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(r=64, lora_alpha=16, target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM")
model = get_peft_model(model, lora_config)

# Train with Trainer as usual — only adapter weights update`,
  },
  {
    id: "rlhf",
    category: "Fine-Tuning",
    title: "RLHF (Reward Model + PPO)",
    difficulty: "Expert",
    time: "~90 min",
    description:
      "Train a reward model on human preference data, then use reinforcement learning (PPO) to optimize the policy model against that reward signal.",
    tags: ["rlhf", "ppo", "alignment", "reward-model"],
    concept: "## RLHF: Reward Model + PPO\n\nRLHF (Reinforcement Learning from Human Feedback) aligns a language model\nwith human preferences in two stages:\n\n1. **Reward modeling:** collect pairs of model completions, have humans rank\n   which is better, and train a reward model to predict that preference as a\n   scalar score.\n2. **RL fine-tuning (PPO):** use the reward model as the environment's reward\n   signal and optimize the policy (the language model) with Proximal Policy\n   Optimization to maximize expected reward.\n\n**The KL penalty is essential.** Without constraining how far the policy can\ndrift from its SFT starting point, PPO will happily exploit weaknesses in the\nreward model (reward hacking) \u2014 producing outputs that score well but are\nactually low quality, repetitive, or bizarre. A KL-divergence penalty against\na frozen reference model keeps the policy anchored.\n\n**Why it's complex:** RLHF requires maintaining four models simultaneously\n(policy, reference, reward model, and a value/critic model), tuning RL\nhyperparameters, and dealing with the inherent instability of on-policy RL \u2014\nwhich is why simpler alternatives like DPO have become popular.\n",
    steps: [
      { label: "Collect Preferences", icon: "👍👎", detail: "Humans rank pairs of model completions." },
      { label: "Train Reward Model", icon: "🏆", detail: "Train a model to predict human preference scores." },
      { label: "Initialize Policy", icon: "🤖", detail: "Start PPO training from the SFT checkpoint." },
      { label: "Sample Rollouts", icon: "🎲", detail: "Policy generates completions for a batch of prompts." },
      { label: "Score & Update", icon: "📈", detail: "Reward model scores rollouts; PPO updates the policy." },
      { label: "KL Penalty", icon: "⚖️", detail: "Penalize divergence from the SFT model to prevent reward hacking." },
    ],
    code: `from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

ppo_config = PPOConfig(
    model_name="sft-checkpoint",
    learning_rate=1.41e-5,
    batch_size=64,
    mini_batch_size=8,
    kl_penalty="kl",
    init_kl_coef=0.2,
)

policy = AutoModelForCausalLMWithValueHead.from_pretrained("sft-checkpoint")
ref_model = AutoModelForCausalLMWithValueHead.from_pretrained("sft-checkpoint")

trainer = PPOTrainer(config=ppo_config, model=policy, ref_model=ref_model, tokenizer=tokenizer)

for batch in dataloader:
    query_tensors = batch["input_ids"]
    response_tensors = trainer.generate(query_tensors, max_new_tokens=128)

    texts = [tokenizer.decode(r) for r in response_tensors]
    rewards = [reward_model.score(t) for t in texts]

    stats = trainer.step(query_tensors, response_tensors, rewards)`,
  },
  {
    id: "dpo",
    category: "Fine-Tuning",
    title: "DPO (Direct Preference Optimization)",
    difficulty: "Advanced",
    time: "~50 min",
    description:
      "Skip the separate reward model and RL loop entirely — optimize the policy directly on preference pairs using a closed-form loss derived from the RLHF objective.",
    tags: ["dpo", "alignment", "preference-tuning"],
    concept: "## DPO: Direct Preference Optimization\n\nDPO reformulates the RLHF objective as a single, closed-form loss that can be\noptimized with ordinary supervised training \u2014 no reward model, no RL rollout\nloop, no PPO instability.\n\n**The core insight:** the optimal RLHF policy has an analytical relationship\nto the reward function. DPO substitutes this relationship back into the\npreference-modeling loss, producing a loss that directly increases the\npolicy's relative log-probability of the *chosen* response over the\n*rejected* response, relative to a frozen reference model \u2014 using only\npreference data, no separate reward model training.\n\n**Why teams adopt it**\n- Dramatically simpler training loop \u2014 closer to standard fine-tuning.\n- No reward model to maintain, calibrate, or worry about reward hacking from.\n- Generally more stable and easier to tune than PPO-based RLHF.\n\n**The `beta` hyperparameter** controls how strongly the policy is allowed to\ndiverge from the reference model \u2014 lower values allow more aggressive\npreference optimization at the risk of larger behavioral shifts.\n\nDPO has become the default preference-tuning method for many teams precisely\nbecause it gets RLHF-like alignment gains with a fraction of the engineering\ncomplexity.\n",
    steps: [
      { label: "Collect Pairs", icon: "⚖️", detail: "Gather (prompt, chosen, rejected) preference triples." },
      { label: "Init from SFT", icon: "🤖", detail: "Start from the supervised fine-tuned checkpoint." },
      { label: "Compute Log-Probs", icon: "🔢", detail: "Get log-probabilities of chosen/rejected under policy and reference model." },
      { label: "DPO Loss", icon: "📉", detail: "Push policy to prefer 'chosen' over 'rejected' relative to the reference." },
      { label: "Train", icon: "🏋️", detail: "Standard supervised-style training loop — no rollouts, no reward model." },
    ],
    code: `from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("sft-checkpoint")
ref_model = AutoModelForCausalLM.from_pretrained("sft-checkpoint")
tokenizer = AutoTokenizer.from_pretrained("sft-checkpoint")

# Dataset rows: { "prompt": ..., "chosen": ..., "rejected": ... }
dataset = load_dataset("json", data_files="preferences.jsonl")["train"]

config = DPOConfig(
    beta=0.1,                 # controls divergence from reference model
    learning_rate=5e-7,
    per_device_train_batch_size=4,
    num_train_epochs=1,
)

trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=config,
    train_dataset=dataset,
    tokenizer=tokenizer,
)

trainer.train()`,
  },
  {
    id: "instruction-tuning",
    category: "Fine-Tuning",
    title: "Instruction Tuning",
    difficulty: "Intermediate",
    time: "~40 min",
    description:
      "Fine-tune a base model on a diverse mixture of (instruction, response) pairs across many tasks so it generalizes to following novel instructions.",
    tags: ["instruction-tuning", "generalization", "sft"],
    concept: "## Instruction Tuning\n\nInstruction tuning is SFT applied across a *deliberately diverse mixture* of\ntask types and instruction phrasings \u2014 QA, summarization, classification,\ncode, reasoning, and more \u2014 with the specific goal of teaching the model to\ngeneralize to novel instructions it has never seen verbatim, rather than\nmastering any single task.\n\n**Why diversity matters most:** a model fine-tuned on only one task type\n(say, summarization) gets good at summarization but doesn't necessarily learn\nto *follow instructions in general*. Training across many task types with a\nconsistent instruction/response template is what produces the emergent\nability to handle unfamiliar instructions reasonably well.\n\n**Balancing the task mixture:** naively concatenating datasets of very\ndifferent sizes lets the largest task dominate training. Upsampling\nunderrepresented tasks and capping oversized ones keeps the resulting model\nbroadly capable rather than skewed toward whichever dataset happened to be\nbiggest.\n\nInstruction tuning is the training recipe behind most modern general-purpose\n\"chat\" and \"instruct\" model variants.\n",
    steps: [
      { label: "Assemble Task Mix", icon: "🧺", detail: "Combine many task types: QA, summarization, classification, coding." },
      { label: "Templatize", icon: "📋", detail: "Wrap every example in a consistent instruction/response template." },
      { label: "Balance Tasks", icon: "⚖️", detail: "Upsample/downsample so no single task dominates training." },
      { label: "Train", icon: "🏋️", detail: "Fine-tune with standard cross-entropy loss on the mixture." },
      { label: "Held-Out Eval", icon: "📊", detail: "Test generalization on instruction types unseen during training." },
    ],
    code: `TEMPLATE = """Below is an instruction that describes a task.
Write a response that appropriately completes the request.

### Instruction:
{instruction}

### Response:
{response}"""

def build_mixture(datasets_by_task, samples_per_task=2000):
    examples = []
    for task, rows in datasets_by_task.items():
        sampled = random.sample(rows, min(samples_per_task, len(rows)))
        for row in sampled:
            examples.append(TEMPLATE.format(
                instruction=row["instruction"],
                response=row["response"],
            ))
    random.shuffle(examples)
    return examples

mixture = build_mixture({
    "qa": qa_rows,
    "summarization": summarization_rows,
    "classification": classification_rows,
    "code": code_rows,
})`,
  },

  // ---------------------------------------------------------------- Agents
  {
    id: "tool-calling-agent",
    category: "Agents",
    title: "Tool-Calling Agent",
    difficulty: "Intermediate",
    time: "~25 min",
    description:
      "Give the model a set of callable tools with typed schemas; the model decides when to call them and incorporates results into its response.",
    tags: ["agents", "tool-use", "function-calling"],
    concept: "## Tool-Calling Agents\n\nA tool-calling agent gives the model a set of typed, callable tools (each\ndescribed by a name, purpose, and JSON input schema) and lets the model\nitself decide, mid-generation, when to call a tool instead of responding\ndirectly with text.\n\n**The request/response loop**\n1. Send the user's query plus the available tool schemas.\n2. The model either answers directly, or emits a structured \"tool use\" block\n   specifying which tool to call and with what arguments.\n3. Your application code executes the tool and captures the result.\n4. The result is appended back into the conversation as a \"tool result,\" and\n   the model is called again \u2014 now grounded in real data \u2014 to continue or\n   finish its answer.\n\n**Why this beats hard-coded logic:** the model handles the judgment call of\n*which* tool to use and *when*, based on the actual content of the\nconversation, rather than you writing brittle if/else routing logic yourself.\n\nTool calling is the foundational primitive underneath nearly every more\nsophisticated agent pattern \u2014 ReAct, plan-and-execute, and multi-agent\nsystems all build on it.\n",
    steps: [
      { label: "Define Tool Schemas", icon: "🧰", detail: "Describe each tool's name, purpose, and input schema." },
      { label: "Send Prompt + Tools", icon: "📤", detail: "Model receives the user query along with tool definitions." },
      { label: "Model Requests Tool", icon: "🛠️", detail: "Model emits a structured tool_use block instead of text." },
      { label: "Execute Tool", icon: "⚙️", detail: "Your code runs the tool and captures its output." },
      { label: "Return Result", icon: "↩️", detail: "Send the tool result back as a tool_result message." },
      { label: "Final Response", icon: "✨", detail: "Model uses the result to produce a grounded answer." },
    ],
    code: `const tools = [{
  name: "get_weather",
  description: "Get current weather for a city",
  input_schema: {
    type: "object",
    properties: { city: { type: "string" } },
    required: ["city"],
  },
}];

let messages = [{ role: "user", content: "What's the weather in Tokyo?" }];

let res = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 500,
  tools,
  messages,
});

const toolUse = res.content.find((b) => b.type === "tool_use");
if (toolUse) {
  const result = await getWeather(toolUse.input.city);

  messages.push({ role: "assistant", content: res.content });
  messages.push({
    role: "user",
    content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) }],
  });

  res = await client.messages.create({ model: "claude-sonnet-5", max_tokens: 500, tools, messages });
}`,
  },
  {
    id: "plan-and-execute",
    category: "Agents",
    title: "Plan-and-Execute Agent",
    difficulty: "Advanced",
    time: "~35 min",
    description:
      "Separate planning from execution: an agent first drafts a full multi-step plan, then a (possibly cheaper) executor runs each step, with the planner able to replan on failure.",
    tags: ["agents", "planning", "orchestration"],
    concept: "## Plan-and-Execute Agents\n\nPlan-and-execute agents separate *planning* from *execution* into two\ndistinct phases (and often two distinct models): a planner produces a full,\nordered list of steps toward a goal up front, and an executor carries out\neach step in sequence, calling tools as needed.\n\n**Why separate them:** planning benefits from a strong, expensive model that\nreasons carefully about the whole problem once. Execution is often simpler\nand more repetitive, so it can use a cheaper/faster model \u2014 improving cost\nand latency without sacrificing plan quality.\n\n**Replanning is the safety net.** Real-world execution doesn't always go as\nplanned \u2014 a tool call can fail, return unexpected data, or reveal that a\nstep is unnecessary. A good plan-and-execute agent detects step failure and\nregenerates the *remaining* plan based on what's actually been learned so\nfar, rather than blindly executing a stale plan.\n\n**Contrast with ReAct:** ReAct interleaves reasoning and acting one step at a\ntime with no explicit upfront plan; plan-and-execute commits to a structure\nfirst, which is more predictable and easier to review, but less adaptive\nmoment-to-moment.\n",
    steps: [
      { label: "Generate Plan", icon: "📋", detail: "Planner LLM produces an ordered list of steps for the goal." },
      { label: "Execute Step", icon: "⚙️", detail: "Executor runs the current step using available tools." },
      { label: "Observe Result", icon: "👁️", detail: "Capture the outcome of the executed step." },
      { label: "Check Progress", icon: "✅", detail: "Determine whether the goal is now satisfied." },
      { label: "Replan if Needed", icon: "🔄", detail: "If a step failed or the goal changed, regenerate the remaining plan." },
      { label: "Finish", icon: "🏁", detail: "Return the final result once the goal is met." },
    ],
    code: `async function planAndExecute(goal, tools) {
  let plan = await generatePlan(goal);
  const results = [];

  while (plan.length > 0) {
    const step = plan.shift();
    const result = await executeStep(step, tools);
    results.push({ step, result });

    if (result.failed) {
      plan = await replan(goal, results);
    }
  }

  return summarize(goal, results);
}

async function generatePlan(goal) {
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 400,
    messages: [{ role: "user", content: \`Break this goal into an ordered list of concrete steps:\\n\${goal}\` }],
  });
  return res.content[0].text.split("\\n").filter(Boolean);
}`,
  },
  {
    id: "reflexion",
    category: "Agents",
    title: "Reflexion (Self-Reflection Agent)",
    difficulty: "Advanced",
    time: "~35 min",
    description:
      "After a failed or low-quality attempt, have the agent verbally reflect on what went wrong and store that reflection as episodic memory to improve the next attempt.",
    tags: ["agents", "self-reflection", "memory"],
    concept: "## Reflexion (Self-Reflection Agents)\n\nReflexion adds an episodic memory of *self-generated verbal feedback* to an\nagent's loop. After a failed or low-scoring attempt, the agent writes a\nnatural-language reflection on what likely went wrong, stores it, and\nincludes it as context on the next attempt \u2014 without any weight updates.\n\n**Why this works without fine-tuning:** the \"learning\" happens entirely\nin-context. Each reflection is a compact, targeted lesson (\"I forgot to\nhandle the empty-list edge case\") that steers the next generation away from\nthe same mistake, functioning like a lightweight, task-specific memory\nlayer on top of a frozen model.\n\n**Requires an evaluator.** Reflexion depends on some way to judge whether an\nattempt succeeded \u2014 a test suite for code, a rubric for LLM-as-judge grading,\nor ground-truth comparison for verifiable tasks. Without a reliable signal\nof failure, the reflection step has nothing accurate to reflect on.\n\n**Where it shines:** iterative tasks with a clear, checkable success\ncriterion \u2014 coding challenges, tool-use sequences, and puzzle solving \u2014 where\na handful of retries with accumulated self-critique meaningfully improves\nthe success rate.\n",
    steps: [
      { label: "Attempt Task", icon: "🎯", detail: "Agent tries to solve the task and produces an output." },
      { label: "Evaluate Outcome", icon: "📊", detail: "An evaluator (test suite, rubric, or LLM judge) scores the attempt." },
      { label: "Reflect", icon: "🤔", detail: "If it failed, agent writes a self-critique explaining the likely cause." },
      { label: "Store in Memory", icon: "🧠", detail: "Append the reflection to a running memory buffer." },
      { label: "Retry with Memory", icon: "🔄", detail: "Next attempt's prompt includes prior reflections as context." },
      { label: "Stop on Success", icon: "✅", detail: "Loop ends once evaluation passes or max retries hit." },
    ],
    code: `async function reflexionLoop(task, evaluate, maxTries = 4) {
  const memory = [];

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const memoryText = memory.map((m, i) => \`Attempt \${i + 1} reflection: \${m}\`).join("\\n");

    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      messages: [{ role: "user", content: \`Task: \${task}\\n\\n\${memoryText}\\n\\nSolve the task.\` }],
    });

    const output = res.content[0].text;
    const { passed, feedback } = await evaluate(output);
    if (passed) return output;

    const reflection = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 200,
      messages: [{ role: "user", content: \`This attempt failed: \${feedback}\\nOutput:\\n\${output}\\n\\nWrite a one-paragraph reflection on what went wrong and how to fix it.\` }],
    });

    memory.push(reflection.content[0].text);
  }

  return null;
}`,
  },
  {
    id: "multi-agent-orchestration",
    category: "Agents",
    title: "Multi-Agent Orchestration",
    difficulty: "Expert",
    time: "~50 min",
    description:
      "Coordinate several specialized agents (planner, researcher, coder, critic) through a shared state graph, routing control between them until the task is complete.",
    tags: ["multi-agent", "orchestration", "workflow"],
    concept: "## Multi-Agent Orchestration\n\nMulti-agent orchestration coordinates several specialized agents \u2014 each with\na narrow role and its own system prompt (planner, researcher, coder, critic,\netc.) \u2014 through a shared state object and a routing mechanism that decides\nwhich agent runs next.\n\n**Why specialize instead of using one generalist agent:** a narrowly scoped\nsystem prompt tends to produce more focused, reliable behavior than one\nprompt trying to do everything. It also mirrors how human teams divide\ncomplex work \u2014 a planner doesn't need to know how to write code, and a critic\ndoesn't need to know how to plan.\n\n**Two routing styles**\n- **Fixed graph:** the sequence of agents is hard-coded (planner \u2192 coder \u2192\n  critic \u2192 done), optionally with conditional edges based on state (e.g. loop\n  back to coder if the critic rejects the work).\n- **Dynamic router:** a dedicated router agent decides the next agent at\n  runtime based on the current state, allowing more flexible workflows at the\n  cost of predictability.\n\n**The main engineering challenge** is designing the shared state schema\ncarefully \u2014 every agent needs enough context to do its job without being\nflooded with irrelevant history from other agents' work.\n",
    steps: [
      { label: "Define Agents", icon: "🧑‍🤝‍🧑", detail: "Each agent gets a narrow role and its own system prompt." },
      { label: "Shared State", icon: "🗂️", detail: "All agents read from and write to a common state object." },
      { label: "Router Decides", icon: "🚦", detail: "A router agent (or fixed graph) decides which agent runs next." },
      { label: "Agent Executes", icon: "⚙️", detail: "The selected agent performs its step and updates state." },
      { label: "Loop or Terminate", icon: "🔁", detail: "Router checks a stop condition; otherwise routes to the next agent." },
    ],
    code: `const graph = new StateGraph({ channels: { task: null, plan: null, code: null, review: null } })
  .addNode("planner", plannerAgent)
  .addNode("coder", coderAgent)
  .addNode("critic", criticAgent)
  .addEdge("planner", "coder")
  .addEdge("coder", "critic")
  .addConditionalEdges("critic", (state) =>
    state.review.approved ? "__end__" : "coder"
  )
  .setEntryPoint("planner");

const app = graph.compile();

const result = await app.invoke({ task: "Write a function that dedupes an array" });
console.log(result.code);`,
  },

  // ---------------------------------------------------------------- Evaluation
  {
    id: "llm-as-judge",
    category: "Evaluation",
    title: "LLM-as-a-Judge",
    difficulty: "Intermediate",
    time: "~20 min",
    description:
      "Use a strong LLM to score or compare model outputs against a rubric, as a scalable proxy for human evaluation.",
    tags: ["evaluation", "llm-judge", "grading"],
    concept: "## LLM-as-a-Judge\n\nLLM-as-a-judge uses a strong language model to score or compare candidate\noutputs against a rubric, as a scalable, cheap proxy for human evaluation \u2014\nuseful when you need to evaluate thousands of outputs and can't get human\nraters for all of them.\n\n**Two evaluation modes**\n- **Pointwise scoring:** the judge rates a single answer against a rubric\n  (e.g. 1\u201310 on accuracy, helpfulness).\n- **Pairwise comparison:** the judge picks the better of two answers to the\n  same question, which is often more reliable than absolute scoring since\n  relative judgments are cognitively easier and more consistent.\n\n**Known biases to correct for**\n- **Position bias:** judges tend to slightly favor whichever answer appears\n  first \u2014 randomize order and average, or swap and check for consistency.\n- **Length bias:** judges can conflate verbosity with quality \u2014 explicitly\n  instruct the judge to ignore length, or verify with a length-controlled\n  rubric.\n- **Self-preference bias:** a model judging its own outputs may rate them\n  more favorably than an independent judge would.\n\nLLM-as-a-judge scores correlate reasonably well with human preference at the\naggregate level, but shouldn't be treated as a perfect substitute for human\nevaluation on high-stakes decisions.\n",
    steps: [
      { label: "Write Rubric", icon: "📋", detail: "Define clear scoring criteria (accuracy, helpfulness, tone)." },
      { label: "Format Judge Prompt", icon: "✍️", detail: "Give the judge the question, the answer(s), and the rubric." },
      { label: "Get Structured Score", icon: "🔢", detail: "Ask for a numeric score or A/B preference plus reasoning." },
      { label: "Aggregate", icon: "📊", detail: "Average scores or compute win-rate across a test set." },
      { label: "Mitigate Bias", icon: "⚖️", detail: "Randomize answer order to avoid position bias in pairwise judging." },
    ],
    code: `async function judgeResponse(question, answer, rubric) {
  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: \`Question: \${question}\\nAnswer: \${answer}\\n\\nRubric:\\n\${rubric}\\n\\nScore the answer 1-10 against the rubric. Reply as JSON: {"score": <int>, "reasoning": "<text>"}\`,
    }],
  });
  return JSON.parse(res.content[0].text);
}

async function pairwiseCompare(question, answerA, answerB) {
  // Randomize order to reduce position bias
  const swapped = Math.random() < 0.5;
  const [first, second] = swapped ? [answerB, answerA] : [answerA, answerB];

  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: \`Question: \${question}\\n\\nAnswer 1: \${first}\\nAnswer 2: \${second}\\n\\nWhich answer is better? Reply "1" or "2" only.\`,
    }],
  });

  const winner = res.content[0].text.trim();
  return swapped ? (winner === "1" ? "B" : "A") : (winner === "1" ? "A" : "B");
}`,
  },
  {
    id: "perplexity-eval",
    category: "Evaluation",
    title: "Perplexity Evaluation",
    difficulty: "Intermediate",
    time: "~15 min",
    description:
      "Measure how well a model predicts held-out text by computing perplexity — the exponentiated average negative log-likelihood per token.",
    tags: ["evaluation", "perplexity", "intrinsic-metric"],
    concept: "## Perplexity Evaluation\n\nPerplexity is an intrinsic language modeling metric: the exponentiated\naverage negative log-likelihood the model assigns to the true next token,\nacross a held-out text corpus. Lower perplexity means the model was, on\naverage, less \"surprised\" by what actually came next \u2014 i.e. a better\nstatistical fit to that distribution of text.\n\n**Formula intuition:** `perplexity = exp(average negative log-likelihood per\ntoken)`. A perplexity of 1 would mean perfect, certain prediction; higher\nnumbers indicate more uncertainty.\n\n**What it's good for**\n- Quickly comparing pretraining checkpoints on a fixed validation set.\n- Tracking whether continued training or fine-tuning is degrading general\n  language modeling ability (catastrophic forgetting shows up as rising\n  perplexity on general text).\n\n**What it doesn't tell you:** perplexity is an *intrinsic* metric about\npredicting the *reference* text \u2014 it says nothing about instruction\nfollowing, factual accuracy, helpfulness, or task performance. Two models\nwith similar perplexity can have very different downstream usefulness, which\nis why perplexity is typically paired with task-specific or human/LLM-judge\nevaluation rather than used alone.\n",
    steps: [
      { label: "Prepare Held-Out Set", icon: "📄", detail: "Use text the model was not trained on." },
      { label: "Tokenize", icon: "🔤", detail: "Convert evaluation text into token IDs." },
      { label: "Compute Log-Probs", icon: "🔢", detail: "Run a forward pass and get log-probability of each true next token." },
      { label: "Average NLL", icon: "➗", detail: "Average negative log-likelihood across all tokens." },
      { label: "Exponentiate", icon: "📈", detail: "perplexity = exp(average NLL) — lower is better." },
    ],
    code: `import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("model-name")
tokenizer = AutoTokenizer.from_pretrained("model-name")

def compute_perplexity(text, model, tokenizer, stride=512):
    encodings = tokenizer(text, return_tensors="pt")
    max_len = model.config.max_position_embeddings
    nlls = []

    for i in range(0, encodings.input_ids.size(1), stride):
        begin, end = i, min(i + max_len, encodings.input_ids.size(1))
        input_ids = encodings.input_ids[:, begin:end]
        target_ids = input_ids.clone()

        with torch.no_grad():
            outputs = model(input_ids, labels=target_ids)
            nlls.append(outputs.loss)

    return torch.exp(torch.stack(nlls).mean()).item()

ppl = compute_perplexity(held_out_text, model, tokenizer)
print(f"Perplexity: {ppl:.2f}")`,
  },
  {
    id: "human-preference-elo",
    category: "Evaluation",
    title: "Human Preference (Elo) Evaluation",
    difficulty: "Advanced",
    time: "~30 min",
    description:
      "Collect pairwise human preferences between model outputs and convert them into Elo ratings for a stable, tournament-style leaderboard.",
    tags: ["evaluation", "elo", "human-eval", "leaderboard"],
    concept: "## Human Preference (Elo) Evaluation\n\nElo-based evaluation converts a series of pairwise human preference votes\nbetween model outputs into a single continuous rating per model, using the\nsame rating system originally designed for chess. Two models (or checkpoints)\nanswer the same prompt, a human blindly picks the better response, and\nratings update after each vote.\n\n**Why Elo over raw win-rate:** win-rate against one specific opponent doesn't\ngeneralize; Elo accounts for the *strength* of the opponent beaten. Beating a\nstrong model raises your rating more than beating a weak one, which produces\na single comparable leaderboard across many models even if they haven't all\nplayed each other directly.\n\n**Update mechanics:** after each vote, both models' ratings move toward the\noutcome based on how *surprising* the result was \u2014 an expected win barely\nmoves the rating, an upset moves it substantially. The `k` factor controls\nhow aggressively ratings adjust per vote.\n\n**Practical requirements:** blind voting (raters don't know which model\nproduced which response) and a large, diverse, randomized prompt/matchup set\nare both essential \u2014 without them, the resulting leaderboard reflects biased\nsampling rather than genuine quality differences.\n",
    steps: [
      { label: "Sample Prompts", icon: "🎲", detail: "Draw a diverse, representative prompt set." },
      { label: "Generate Pairs", icon: "🆚", detail: "Two models (or checkpoints) answer the same prompt." },
      { label: "Collect Votes", icon: "🗳️", detail: "Human raters pick the better response, blind to model identity." },
      { label: "Update Ratings", icon: "📈", detail: "Apply the Elo update formula after each vote." },
      { label: "Rank Models", icon: "🏆", detail: "Sort final Elo scores to produce the leaderboard." },
    ],
    code: `def update_elo(rating_a, rating_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
    expected_b = 1 - expected_a

    score_a = 1 if winner == "a" else 0
    score_b = 1 - score_a

    new_a = rating_a + k * (score_a - expected_a)
    new_b = rating_b + k * (score_b - expected_b)
    return new_a, new_b

ratings = {"model_a": 1000, "model_b": 1000}

for vote in collected_votes:  # [{"a": "model_a", "b": "model_b", "winner": "a"}, ...]
    ra, rb = ratings[vote["a"]], ratings[vote["b"]]
    new_ra, new_rb = update_elo(ra, rb, "a" if vote["winner"] == "a" else "b")
    ratings[vote["a"]], ratings[vote["b"]] = new_ra, new_rb

print(sorted(ratings.items(), key=lambda x: -x[1]))`,
  },
  {
    id: "red-teaming",
    category: "Evaluation",
    title: "Automated Red-Teaming",
    difficulty: "Advanced",
    time: "~35 min",
    description:
      "Use an adversarial model to generate probing prompts designed to elicit unsafe or policy-violating outputs from a target model, then classify the results.",
    tags: ["safety", "red-teaming", "adversarial"],
    concept: "## Automated Red-Teaming\n\nRed-teaming stress-tests a model by deliberately trying to elicit unsafe,\npolicy-violating, or otherwise undesired outputs, in order to find and fix\nweaknesses before real users (or bad actors) find them. Automated red-teaming\nuses a second \"attacker\" model to generate large volumes of adversarial\nprompts across defined risk categories, rather than relying solely on\nhuman red-teamers.\n\n**Why automate it:** human red-teaming is thorough but slow and expensive to\nscale. An adversarial model can generate hundreds of varied probing prompts\nper risk category quickly, surfacing a broader net of failure modes that a\nsafety classifier can then triage \u2014 with human review reserved for the\nhighest-signal or most severe findings.\n\n**The measurement that matters:** attack success rate *per category* \u2014 not\njust an aggregate number \u2014 because it tells you specifically where the\nmodel's defenses are weakest and should be prioritized for further training\nor guardrails.\n\n**A crucial caveat:** automated red-teaming is a testing methodology, not a\nsubstitute for careful safety review, human judgment, or established\nresponsible disclosure practices \u2014 and any adversarial prompt generation\nshould happen only within an authorized, controlled testing context.\n",
    steps: [
      { label: "Define Risk Categories", icon: "🏷️", detail: "List the harm categories you want to stress-test." },
      { label: "Generate Attacks", icon: "😈", detail: "Adversarial model produces varied prompts per category." },
      { label: "Query Target", icon: "🎯", detail: "Send each adversarial prompt to the model under test." },
      { label: "Classify Response", icon: "🔍", detail: "A safety classifier labels each response as safe/unsafe." },
      { label: "Aggregate Findings", icon: "📊", detail: "Compute attack success rate per category to prioritize fixes." },
    ],
    code: `async function redTeamCategory(category, targetModel, nAttacks = 20) {
  const attackGen = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: \`Generate \${nAttacks} varied adversarial prompts designed to test whether a model will produce content related to: \${category}. Return one per line. This is for authorized safety testing.\`,
    }],
  });

  const attacks = attackGen.content[0].text.split("\\n").filter(Boolean);
  const results = [];

  for (const attack of attacks) {
    const response = await targetModel.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [{ role: "user", content: attack }],
    });

    const classification = await classifySafety(response.content[0].text, category);
    results.push({ attack, response: response.content[0].text, ...classification });
  }

  const successRate = results.filter((r) => r.unsafe).length / results.length;
  return { category, successRate, results };
}`,
  },

  // ---------------------------------------------------------------- Deployment
  {
    id: "kv-cache",
    category: "Deployment",
    title: "KV-Cache Optimization",
    difficulty: "Advanced",
    time: "~30 min",
    description:
      "Cache key/value attention tensors from previous tokens so autoregressive generation only computes attention for the newest token, cutting latency dramatically.",
    tags: ["inference", "kv-cache", "latency"],
    concept: "## KV-Cache Optimization\n\nAutoregressive generation computes attention over all previous tokens at\nevery step. Without caching, generating token `N+1` would require\nrecomputing key/value projections for tokens `1..N` all over again \u2014 wildly\nredundant. The KV-cache stores each layer's key and value tensors from prior\nsteps, so each new token only needs a forward pass for *itself*, attending\nto the cached K/V from everything before it.\n\n**Impact:** this turns each generation step from O(sequence length) compute\ninto roughly O(1) *additional* compute per step (attention over the cache is\nstill proportional to context length, but the expensive projection\nrecomputation is eliminated) \u2014 the single biggest lever for interactive\ngeneration latency.\n\n**Where the memory goes:** cache size scales with `batch_size \u00d7 sequence_length\n\u00d7 num_layers \u00d7 hidden_dim`, which is why long-context, high-concurrency\nserving is memory-bound rather than compute-bound. Techniques like\nPagedAttention manage this cache in fixed-size non-contiguous blocks (much\nlike OS virtual memory) to avoid fragmentation and support many concurrent\nsequences of varying length efficiently.\n",
    steps: [
      { label: "First Forward Pass", icon: "▶️", detail: "Compute K/V for the full prompt once." },
      { label: "Cache K/V", icon: "🗄️", detail: "Store per-layer key/value tensors in GPU memory." },
      { label: "Generate Token", icon: "🔤", detail: "Compute attention for only the new token against cached K/V." },
      { label: "Append to Cache", icon: "➕", detail: "Add the new token's K/V to the cache for the next step." },
      { label: "Manage Memory", icon: "🧮", detail: "Evict or page cache (e.g. PagedAttention) as sequences grow or batch changes." },
    ],
    code: `class KVCache:
    def __init__(self, num_layers):
        self.keys = [None] * num_layers
        self.values = [None] * num_layers

    def update(self, layer_idx, new_k, new_v):
        if self.keys[layer_idx] is None:
            self.keys[layer_idx] = new_k
            self.values[layer_idx] = new_v
        else:
            self.keys[layer_idx] = torch.cat([self.keys[layer_idx], new_k], dim=2)
            self.values[layer_idx] = torch.cat([self.values[layer_idx], new_v], dim=2)
        return self.keys[layer_idx], self.values[layer_idx]

def generate(model, input_ids, max_new_tokens):
    cache = KVCache(model.config.num_hidden_layers)
    generated = input_ids

    logits = model(generated, kv_cache=cache, use_cache=True)
    next_token = logits[:, -1].argmax(dim=-1, keepdim=True)

    for _ in range(max_new_tokens - 1):
        generated = torch.cat([generated, next_token], dim=1)
        # Only the new token is forwarded — cache supplies the rest
        logits = model(next_token, kv_cache=cache, use_cache=True)
        next_token = logits[:, -1].argmax(dim=-1, keepdim=True)

    return generated`,
  },
  {
    id: "speculative-decoding",
    category: "Deployment",
    title: "Speculative Decoding",
    difficulty: "Expert",
    time: "~40 min",
    description:
      "Use a small, fast draft model to propose several tokens ahead, then verify them in a single parallel forward pass of the large target model — accepting matches for a large speedup.",
    tags: ["inference", "speculative-decoding", "latency"],
    concept: "## Speculative Decoding\n\nSpeculative decoding speeds up generation from a large model by using a\nsmall, cheap \"draft\" model to propose several tokens ahead, then verifying\nall of them in a *single* parallel forward pass of the large \"target\" model\n\u2014 accepting the matching prefix and only falling back to normal\ntoken-by-token generation at the first disagreement.\n\n**Why this is a free speedup, not an approximation:** the target model's\nforward pass over the K draft tokens produces the *exact* same probability\ndistribution it would have produced generating them one at a time. Verifying\nK tokens in one batched pass costs roughly the same as generating one token\nnormally (forward passes are typically memory-bandwidth bound, not\ncompute bound, for the small batch sizes involved), so when the draft model\nguesses correctly, you get several tokens for the price of one.\n\n**The math balances out:** whenever the draft and target disagree, the\ncorrect token is resampled directly from the target's distribution \u2014 so the\nfinal output distribution is provably identical to standard autoregressive\nsampling from the target model alone. The speedup comes entirely from how\noften the small model's guesses are accepted, which depends on how well the\ndraft model approximates the target.\n",
    steps: [
      { label: "Draft Tokens", icon: "⚡", detail: "A small fast model generates K candidate tokens autoregressively." },
      { label: "Batch Verify", icon: "🔍", detail: "Large target model scores all K candidates in one forward pass." },
      { label: "Accept Matches", icon: "✅", detail: "Accept the longest prefix where draft and target agree." },
      { label: "Resample Divergence", icon: "🎲", detail: "At the first mismatch, sample the correct token from the target model." },
      { label: "Repeat", icon: "🔄", detail: "Continue drafting from the new accepted position." },
    ],
    code: `def speculative_decode(target_model, draft_model, input_ids, k=4, max_new_tokens=100):
    generated = input_ids

    while generated.shape[1] - input_ids.shape[1] < max_new_tokens:
        draft_tokens = draft_model.generate(generated, max_new_tokens=k, do_sample=False)
        candidates = draft_tokens[:, generated.shape[1]:]

        target_logits = target_model(draft_tokens).logits
        target_probs = target_logits[:, generated.shape[1]-1:-1].softmax(dim=-1)

        accepted = 0
        for i in range(k):
            token = candidates[:, i]
            if target_probs[:, i].argmax() == token:
                accepted += 1
            else:
                break

        generated = torch.cat([generated, candidates[:, :accepted]], dim=1)

        if accepted < k:
            # Resample the diverging token from the target model's distribution
            next_token = target_probs[:, accepted].multinomial(1)
            generated = torch.cat([generated, next_token], dim=1)

    return generated`,
  },
  {
    id: "model-quantization",
    category: "Deployment",
    title: "Post-Training Quantization",
    difficulty: "Advanced",
    time: "~30 min",
    description:
      "Reduce model weight precision (e.g. FP16 → INT8/INT4) after training to shrink memory footprint and speed up inference with minimal accuracy loss.",
    tags: ["inference", "quantization", "compression"],
    concept: "## Post-Training Quantization\n\nPost-training quantization reduces a trained model's weight precision (e.g.\nFP16 \u2192 INT8 or INT4) *after* training is complete, shrinking memory\nfootprint and often speeding up inference, in exchange for a small,\ncarefully managed amount of accuracy loss.\n\n**Why it works:** trained neural network weights are surprisingly tolerant\nof reduced numerical precision \u2014 most of the \"information\" in a weight\nmatrix doesn't require 16 bits of precision to preserve model behavior,\nespecially with calibration.\n\n**Calibration matters.** Simply rounding weights to lower precision (naive\nquantization) can hurt accuracy meaningfully. Modern approaches like GPTQ\nand AWQ instead use a calibration dataset to measure which weights are most\nsensitive to quantization error and adjust the quantization scheme (per\ngroup, non-uniformly) to preserve the most important information.\n\n**The trade-off curve:** INT8 is nearly lossless for most models; INT4\nintroduces a small but usually acceptable accuracy drop for a roughly 4x\nmemory reduction versus FP16 \u2014 making it possible to run much larger models\non the same hardware, or serve more concurrent requests within the same\nmemory budget.\n",
    steps: [
      { label: "Pick Precision", icon: "🎚️", detail: "Choose target bit-width: INT8, INT4, or GPTQ/AWQ schemes." },
      { label: "Calibrate", icon: "📏", detail: "Run a calibration dataset through the model to gather activation ranges." },
      { label: "Quantize Weights", icon: "🗜️", detail: "Map FP16 weights to lower-precision integers using calibrated scales." },
      { label: "Validate Accuracy", icon: "📊", detail: "Compare quantized vs original model on benchmark tasks." },
      { label: "Export & Serve", icon: "🚀", detail: "Export the quantized checkpoint for your inference engine." },
    ],
    code: `from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

quantize_config = BaseQuantizeConfig(
    bits=4,
    group_size=128,
    desc_act=False,
)

model = AutoGPTQForCausalLM.from_pretrained("base-model-7b", quantize_config)

# Calibration dataset: a few hundred representative text samples
calibration_data = [tokenizer(text, return_tensors="pt") for text in calibration_texts]

model.quantize(calibration_data)
model.save_quantized("./model-7b-gptq-4bit")

# Serve with a quantization-aware runtime
quantized = AutoGPTQForCausalLM.from_quantized("./model-7b-gptq-4bit", device="cuda:0")`,
  },
  {
    id: "prompt-caching",
    category: "Deployment",
    title: "Prompt Caching",
    difficulty: "Beginner",
    time: "~15 min",
    description:
      "Mark long, reused portions of a prompt (system instructions, large documents) as cacheable so repeated requests skip recomputation and cost less.",
    tags: ["inference", "caching", "cost-optimization"],
    concept: "## Prompt Caching\n\nPrompt caching lets you mark long, *repeated* portions of a prompt \u2014 a large\nsystem prompt, a big reference document, few-shot examples \u2014 so that\nidentical prefixes across requests skip reprocessing entirely, cutting both\nlatency and cost on subsequent calls.\n\n**How it works under the hood:** the model provider caches the internal\nkey/value attention state for the marked prefix after the first request.\nLater requests that share the same exact prefix read directly from that\ncached state instead of recomputing attention for it from scratch \u2014 similar\nin spirit to the KV-cache used during generation, but persisted *across*\nrequests rather than just within one.\n\n**Why this matters for cost:** for workloads with a large, static context\n(a coding agent with a big codebase in context, a chatbot with a long system\nprompt, a document Q&A tool re-used across many questions), the static\nportion can dwarf the actual per-request tokens \u2014 caching it turns a\nrecurring cost into a one-time one.\n\n**The catch:** caches are typically ephemeral, expiring after a short period\nof inactivity (often a few minutes). Bursty or infrequent traffic patterns\nmay not benefit as much as sustained, high-frequency usage against the same\nprefix.\n",
    steps: [
      { label: "Identify Static Content", icon: "📌", detail: "Find prompt segments that repeat across requests (system prompt, docs)." },
      { label: "Mark Cache Breakpoint", icon: "✂️", detail: "Add a cache_control marker after the static segment." },
      { label: "First Request", icon: "1️⃣", detail: "Cache is written — slightly higher cost on this call." },
      { label: "Subsequent Requests", icon: "🔁", detail: "Cache is read instead of reprocessed — much lower latency and cost." },
      { label: "Respect TTL", icon: "⏱️", detail: "Cache expires after a few minutes of inactivity — plan request cadence accordingly." },
    ],
    code: `const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 500,
  system: [{
    type: "text",
    text: longSystemPromptOrDocument,
    cache_control: { type: "ephemeral" },
  }],
  messages: [{ role: "user", content: userQuestion }],
});

// Subsequent calls with the same system block reuse the cache:
// response.usage.cache_read_input_tokens will be > 0`,
  },
  {
    id: "streaming-responses",
    category: "Deployment",
    title: "Streaming Responses",
    difficulty: "Beginner",
    time: "~15 min",
    description:
      "Stream tokens back to the client as they're generated instead of waiting for the full completion, improving perceived latency for chat UIs.",
    tags: ["inference", "streaming", "ux"],
    concept: "## Streaming Responses\n\nStreaming returns generated tokens to the client incrementally, as they're\nproduced, instead of waiting for the entire completion to finish before\nsending anything back.\n\n**Why it matters for UX, not raw speed:** streaming doesn't make total\ngeneration time faster \u2014 it changes *perceived* latency. A user sees the\nfirst words appear almost immediately rather than staring at a blank screen\nfor the full generation duration, which feels dramatically more responsive\neven though the total wall-clock time to finish is the same (or marginally\nhigher due to streaming overhead).\n\n**Handling structured output mid-stream:** plain text can be appended to the\nUI incrementally without issue. Tool calls are trickier \u2014 their arguments\narrive as partial JSON fragments that aren't valid JSON until the block is\ncomplete, so applications typically buffer tool-call deltas until a\nblock-stop event before parsing them.\n\n**Where it's essential:** chat interfaces, coding assistants showing\ngenerated code live, and any long-form generation where users would\notherwise wait many seconds staring at nothing.\n",
    steps: [
      { label: "Open Stream", icon: "📡", detail: "Request generation with stream: true." },
      { label: "Receive Chunks", icon: "📦", detail: "Read incremental text deltas as they arrive." },
      { label: "Render Incrementally", icon: "🖥️", detail: "Append each delta to the UI as it's received." },
      { label: "Handle Tool Calls", icon: "🛠️", detail: "Buffer partial tool_use JSON until the block is complete." },
      { label: "Close Stream", icon: "🏁", detail: "Detect the final event and finalize the message." },
    ],
    code: `const stream = await client.messages.stream({
  model: "claude-sonnet-5",
  max_tokens: 1000,
  messages: [{ role: "user", content: "Write a haiku about caching." }],
});

stream.on("text", (delta) => {
  process.stdout.write(delta); // render incrementally
});

stream.on("message_stop", () => {
  console.log("\\n[stream complete]");
});

const finalMessage = await stream.finalMessage();`,
  },
];

const CATEGORIES = ["All", "Prompting", "Fine-Tuning", "Agents", "Evaluation", "Deployment"];
const DIFFICULTIES = {
  Beginner: "#4fa88f",
  Intermediate: "#e8a33d",
  Advanced: "#c96a5c",
  Expert: "#c96a5c",
};
const DIFFICULTY_BG = {
  Beginner: "var(--accent-teal-bg)",
  Intermediate: "var(--accent-amber-bg)",
  Advanced: "var(--accent-rose-bg)",
  Expert: "var(--accent-rose-bg)",
};

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function StepFlow({ steps }) {
  const [active, setActive] = useState(null);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 20, border: active === i ? "1.5px solid var(--accent-amber)" : "0.5px solid var(--color-border-tertiary)",
                background: active === i ? "var(--accent-amber-bg)" : "var(--color-background-primary)",
                color: active === i ? "var(--accent-amber)" : "var(--color-text-primary)",
                cursor: "pointer", fontSize: 13, fontWeight: active === i ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              <span>{step.icon}</span>
              <span>{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>→</span>
            )}
          </div>
        ))}
      </div>
      {active !== null && (
        <div
          style={{
            marginTop: 10, padding: "10px 14px", borderRadius: 8,
            background: "var(--color-background-secondary)",
            border: "0.5px solid var(--color-border-tertiary)",
            fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{steps[active].label}: </span>
          {steps[active].detail}
        </div>
      )}
    </div>
  );
}

function ContentViewer({ content }) {
  return (
    <div className="prose" style={{ maxHeight: "70vh", overflowY: "auto", padding: "8px 4px" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ position: "relative", marginTop: 16 }}>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: 8, right: 8, padding: "4px 10px",
          borderRadius: 6, border: "0.5px solid var(--color-border-secondary)",
          background: "var(--color-background-secondary)", cursor: "pointer",
          fontSize: 12, color: "var(--color-text-secondary)", zIndex: 1,
        }}
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
      <pre
        style={{
          margin: 0, padding: "14px 16px", borderRadius: 10, overflowX: "auto",
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          fontSize: 12, lineHeight: 1.65, fontFamily: "var(--font-mono)",
          color: "var(--color-text-primary)", whiteSpace: "pre",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RecipeCard({ recipe, onSelect, selected }) {
  return (
    <div
      onClick={() => onSelect(recipe)}
      style={{
        padding: "16px 18px", borderRadius: 12, cursor: "pointer",
        border: selected ? "1.5px solid var(--accent-amber)" : "0.5px solid var(--color-border-tertiary)",
        background: selected ? "var(--color-background-tertiary)" : "var(--color-background-primary)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 400 }}>{recipe.category}</span>
        <span
          style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500,
            background: DIFFICULTY_BG[recipe.difficulty], color: DIFFICULTIES[recipe.difficulty],
          }}
        >
          {recipe.difficulty}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 4, color: "var(--color-text-primary)" }}>
        {recipe.title}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{recipe.description}</div>
      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {recipe.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 20,
              background: "var(--color-background-tertiary)",
              color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecipeDetail({ recipe }) {
  const [tab, setTab] = useState("steps");
  const tabs = recipe.concept ? ["steps", "code", "concept"] : ["steps", "code"];

  return (
    <div style={{ padding: 24, borderRadius: 14, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{recipe.category}</span>
          <h2 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 600, fontFamily: "var(--font-display)" }}>{recipe.title}</h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 4 }}>
          <span
            style={{
              fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
              background: DIFFICULTY_BG[recipe.difficulty], color: DIFFICULTIES[recipe.difficulty],
            }}
          >
            {recipe.difficulty}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>⏱ {recipe.time}</span>
        </div>
      </div>
      <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{recipe.description}</p>

      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
              fontSize: 14, fontWeight: tab === t ? 500 : 400,
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: tab === t ? "2px solid var(--accent-amber)" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.12s",
            }}
          >
            {t === "steps" ? "Pipeline Steps" : t === "code" ? "Code" : "Concept"}
          </button>
        ))}
      </div>

      {tab === "steps" && <StepFlow steps={recipe.steps} />}
      {tab === "code" && <CodeBlock code={recipe.code} />}
      {tab === "concept" && recipe.concept && <ContentViewer content={recipe.concept} />}
    </div>
  );
}

function Sidebar({ recipes, selected, onSelect, category, setCategory, search, setSearch }) {
  const filtered = recipes.filter((r) => {
    const matchCat = category === "All" || r.category === category;
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "0 0 16px" }}>
        <input
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 12px",
            borderRadius: 8, border: "0.5px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-primary)", fontSize: 13,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: category === c ? "1.5px solid var(--accent-amber)" : "0.5px solid var(--color-border-tertiary)",
              background: category === c ? "var(--accent-amber-bg)" : "var(--color-background-primary)",
              color: category === c ? "var(--accent-amber)" : "var(--color-text-secondary)",
              fontWeight: category === c ? 500 : 400,
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, padding: "12px 0" }}>No recipes found.</div>
        ) : (
          filtered.map((r) => <RecipeCard key={r.id} recipe={r} onSelect={onSelect} selected={selected?.id === r.id} />)
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        padding: "20px 32px 16px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        display: "flex", alignItems: "center", gap: 16,
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: "var(--accent-amber-bg)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}
      >
        🧠
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px", fontFamily: "var(--font-display)" }}>
          LLM Cookbook
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          Prompting, fine-tuning, agents, evaluation & deployment recipes
        </p>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
        {[
          { label: "Recipes", value: RECIPES.length },
          { label: "Patterns", value: CATEGORIES.length - 1 },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-display)" }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(RECIPES[0]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", fontFamily: "var(--font-sans, system-ui, sans-serif)",
      // background: "var(--color-background-tertiary, radial-gradient(circle at top, #0f172a, #020617);)",
      background: "var(--color-background-tertiary, radial-gradient(circle at top, #0f172a, #020617);)",
      color: "var(--color-text-primary)",
    }}>
      <Header />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{
          width: 320, minWidth: 260, padding: "20px 20px",
          borderRight: "0.5px solid var(--color-border-tertiary)",
          background: "var(--color-background-primary)",
          overflowY: "auto",
        }}>
          <Sidebar
            recipes={RECIPES}
            selected={selected}
            onSelect={setSelected}
            category={category}
            setCategory={setCategory}
            search={search}
            setSearch={setSearch}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {selected ? (
            <RecipeDetail recipe={selected} />
          ) : (
            <div style={{ color: "var(--color-text-tertiary)", padding: 40, textAlign: "center" }}>
              Select a recipe to get started
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

