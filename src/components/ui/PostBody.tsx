/** Plain-text body rendered as paragraphs (no HTML is ever injected). */
export function PostBody({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{para.split("\n").map((line, j, arr) => (j < arr.length - 1 ? [line, <br key={j} />] : line))}</p>
      ))}
    </>
  );
}
