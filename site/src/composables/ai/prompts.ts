export const PROMPTS = {
  generateFromDoc: (doc: string) => `You are a professional resume writer. Given the following project documentation, generate 3-5 resume bullet points that highlight achievements using the STAR method. Each bullet should include quantified results where possible. Output only the bullet points in Markdown format, one per line starting with "- ".

Project documentation:
${doc}`,

  optimizeFromJD: (jd: string, currentResume: string) => `You are a professional resume writer. Optimize the following resume content to better match the job description. Focus on:
1. Aligning keywords from the JD with the resume content
2. Rewriting weak bullet points to be more impactful (STAR method)
3. Adding quantified achievements where the JD suggests them
4. Do NOT fabricate experience - only rephrase and emphasize existing content

Job Description:
${jd}

Current Resume:
${currentResume}

Output the optimized resume in Markdown format. Only output the resume content, no explanations.`
};
