/**
 * Appends an optional user-supplied instruction block to a fully-built AI prompt.
 * Returns the prompt unchanged when no instructions are provided.
 */
function appendAdditionalInstructions(prompt, additionalInstructions) {
  const extra = (additionalInstructions || '').toString().trim();
  if (!extra) return prompt;
  return `${prompt}\n\nADDITIONAL INSTRUCTIONS FROM USER (apply these on top of the requirements above, without breaking any required output format):\n${extra}\n`;
}

module.exports = { appendAdditionalInstructions };
