import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import lesson12 from "../../content/lessons/lesson-1.2.json";
import { useProgress } from "../store";
import { LessonPlayer } from "./LessonPlayer";
import { PracticePlayer } from "./PracticePlayer";

const Home = () => <p>HOME</p>;

function renderLesson(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lesson/:id" element={<LessonPlayer />} />
        <Route path="/practice/:id" element={<p>OVERVIEW</p>} />
        <Route path="/practice/:id/:n" element={<PracticePlayer />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().reset();
});

describe("lesson player", () => {
  it("shows the exact mistake reply, then accepts the right answer and saves the position", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2");
    await screen.findByText("Where is minus 3?");
    const slider = screen.getByRole("slider");
    expect(screen.getByTestId("primary")).toBeDisabled();
    slider.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    await user.click(screen.getByTestId("primary"));
    expect(
      await screen.findByText(
        "That is plus 3. Minus numbers are on the other side of 0. Which side is that?",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("try-again"));
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByText("Yes, −3.")).toBeInTheDocument();
    await user.click(screen.getByTestId("continue"));
    await screen.findByText("PUZZLE");
    expect(useProgress.getState().lessons["1.2"].screen).toBe(1);
    expect(useProgress.getState().lessons["1.2"].screensDone).toContain("1.2.01");
    // Close, then reopen at screen 2.
    await user.click(screen.getByLabelText("Close lesson"));
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("opens at the saved screen", async () => {
    useProgress.getState().startLesson("1.2", 14);
    useProgress.getState().setScreen("1.2", 1);
    renderLesson("/lesson/1.2");
    expect(await screen.findByText("PUZZLE")).toBeInTheDocument();
  });

  it("rejects text, does not count an attempt, and keeps Check disabled without input", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.11");
    await screen.findByLabelText("Your answer");
    expect(screen.getByTestId("primary")).toBeDisabled();
    await user.type(screen.getByLabelText("Your answer"), "abc");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a number");
    expect(useProgress.getState().lessons["1.2"].attempts["1.2.11"]).toBeUndefined();
  });

  it("opens hints one at a time and allows two at most", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.12");
    await screen.findByLabelText("Your answer");
    await user.click(screen.getByRole("button", { name: /Hint/ }));
    expect(screen.getByRole("region", { name: "Hint 1 of 2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Hint/ }));
    expect(screen.getByRole("region", { name: "Hint 2 of 2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Hint/ }));
    expect(screen.queryByRole("region", { name: /Hint/ })).toBeNull();
  });

  it("offers Show me why after two wrong answers, then the twin", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.12");
    await screen.findByLabelText("Your answer");
    await user.type(screen.getByLabelText("Your answer"), "14");
    await user.click(screen.getByTestId("primary"));
    await screen.findByTestId("try-again");
    expect(screen.queryByTestId("show-me")).toBeNull();
    await user.click(screen.getByTestId("try-again"));
    await user.type(screen.getByLabelText("Your answer"), "2");
    await user.click(screen.getByTestId("primary"));
    await user.click(await screen.findByTestId("show-me"));
    expect(screen.getByTestId("show-me-steps")).toBeInTheDocument();
    await user.click(screen.getByTestId("show-me-continue"));
    const screen12 = lesson12.screens[11];
    const twin = screen12.twin as { answer: { value: number } };
    await user.type(await screen.findByLabelText("Your answer"), String(twin.answer.value));
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByTestId("continue")).toBeInTheDocument();
  });

  it("finishes the lesson: saves rules and marks it complete", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.14");
    await screen.findByText("ONE LAST TRAP");
    await user.click(screen.getByRole("button", { name: "False" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Correct. It is false.");
    await user.click(screen.getByTestId("primary"));
    await waitFor(() => expect(screen.getByText("HOME")).toBeInTheDocument());
    const st = useProgress.getState();
    expect(st.lessons["1.2"].state).toBe("complete");
    expect(Object.keys(st.rules)).toEqual(expect.arrayContaining(["N2", "N4", "N5"]));
  });

  it("answers a choice screen and a multi-number screen", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.13");
    const slots = await screen.findAllByLabelText(/Your answer, part/);
    expect(slots).toHaveLength(2);
    await user.type(slots[0], "1");
    await user.type(slots[1], "1");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByTestId("try-again")).toBeInTheDocument();
  });

  it("says when a lesson does not exist", async () => {
    renderLesson("/lesson/9.9");
    expect(await screen.findByText("This lesson is not available yet.")).toBeInTheDocument();
  });
});

describe("widgets in the lesson player", () => {
  it("proof: a wrong reason opens the hint-style sheet, then the proof completes", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.07");
    const tray = await screen.findByRole("group", { name: "Reasons" });
    expect(screen.getByTestId("primary")).toBeDisabled();
    await user.click(within(tray).getByRole("button", { name: "N2" }));
    await user.click(screen.getByTestId("primary"));
    const proof = lesson12.screens[6].interaction as unknown as {
      wrongReasonReplies: Record<string, string>;
      lines: { reason: string | null }[];
      feedback: { correctTitle: string };
    };
    expect(await screen.findByText("Not N2.")).toBeInTheDocument();
    expect(screen.getByText(proof.wrongReasonReplies["N2"])).toBeInTheDocument();
    await user.click(screen.getByTestId("try-again"));
    const labels: Record<string, string> = {
      "add-both": "add −a to both sides",
      N2: "N2",
      N1: "N1",
    };
    for (const line of proof.lines.filter((l) => l.reason)) {
      await user.click(
        within(screen.getByRole("group", { name: "Reasons" })).getByRole("button", {
          name: labels[line.reason as string],
        }),
      );
      await user.click(screen.getByTestId("primary"));
    }
    expect(await screen.findByText(proof.feedback.correctTitle)).toBeInTheDocument();
    await user.click(screen.getByTestId("continue"));
    await screen.findByText("Minus of a sum");
  });

  it("thermometer: Check reveals the result sheet", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.02");
    const slider = await screen.findByRole("slider", { name: /Thermometer/ });
    expect(screen.getByTestId("primary")).toBeDisabled();
    slider.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByTestId("continue")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Feedback" })).toHaveTextContent("−5");
  });

  it("hops: five hops to the left give the equation and the right answer", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.03");
    const slider = await screen.findByRole("slider");
    expect(screen.getByTestId("hops-equation")).toHaveTextContent("?");
    slider.focus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(screen.getByTestId("hops-equation")).toHaveTextContent("−2");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByText("Yes, −2.")).toBeInTheDocument();
  });

  it("balance: remove three cubes from each pan, then answer x", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.10");
    await screen.findByTestId("balance-readout");
    await user.click(screen.getAllByTestId("cube-left")[0]);
    expect(screen.getByTestId("balance-readout")).toHaveTextContent("heavier");
    for (let k = 0; k < 2; k++) await user.click(screen.getAllByTestId("cube-left")[0]);
    for (let k = 0; k < 3; k++) await user.click(screen.getAllByTestId("cube-right")[0]);
    expect(screen.getByTestId("balance-readout")).toHaveTextContent("Level");
    await user.type(screen.getByLabelText("Your answer"), "2");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByText("Yes, x = 2.")).toBeInTheDocument();
  });

  it("compare screen: a choice answer", async () => {
    const user = userEvent.setup();
    renderLesson("/lesson/1.2?screen=1.2.04");
    await user.click(await screen.findByRole("button", { name: /No, they stop/ }));
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByTestId("try-again")).toBeInTheDocument();
  });
});

describe("every screen of lesson 1.2 renders", () => {
  for (const sc of lesson12.screens) {
    it(`screen ${sc.id}`, async () => {
      renderLesson(`/lesson/1.2?screen=${sc.id}`);
      expect(await screen.findByRole("heading", { level: 1, name: sc.title })).toBeInTheDocument();
      expect(screen.queryByTestId("widget-placeholder")).toBeNull();
      if (sc.interaction.type === "proof") {
        expect(screen.getByRole("list", { name: /Proof/ })).toBeInTheDocument();
      }
      if (sc.interaction.type === "balance") {
        expect(screen.getByRole("group", { name: /Balance/ })).toBeInTheDocument();
      }
      if (sc.interaction.type === "thermometer") {
        expect(screen.getByRole("slider", { name: /Thermometer/ })).toBeInTheDocument();
      }
    });
  }
});

describe("practice player", () => {
  it("checks a number answer with its mistake reply, then marks correct", async () => {
    const user = userEvent.setup();
    renderLesson("/practice/1.2/6");
    await screen.findByText("Problem 6");
    await user.type(screen.getByLabelText("Your answer"), "-2");
    await user.click(screen.getByTestId("primary"));
    expect(
      await screen.findByText("That is 3 + (−5). Add 5 to both sides: x = 3 + 5."),
    ).toBeInTheDocument();
    expect(useProgress.getState().banks["1.2"].problems["b1.2.06"].state).toBe("not-yet");
    await user.click(screen.getByTestId("try-again"));
    await user.type(screen.getByLabelText("Your answer"), "8");
    await user.click(screen.getByTestId("primary"));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(useProgress.getState().banks["1.2"].problems["b1.2.06"].state).toBe("correct");
  });

  it("self-check: Show solution, then I got it", async () => {
    const user = userEvent.setup();
    renderLesson("/practice/1.2/1");
    await screen.findByText("Problem 1");
    await user.click(screen.getByTestId("show-solution"));
    expect(screen.getByTestId("solution")).toBeInTheDocument();
    await user.click(screen.getByTestId("got-it"));
    expect(useProgress.getState().banks["1.2"].problems["b1.2.01"].state).toBe("correct");
  });

  it("self-check: Not yet marks the problem not yet", async () => {
    const user = userEvent.setup();
    renderLesson("/practice/1.2/2");
    await screen.findByText("Problem 2");
    await user.click(screen.getByTestId("show-solution"));
    await user.click(screen.getByTestId("not-yet"));
    expect(useProgress.getState().banks["1.2"].problems["b1.2.02"].state).toBe("not-yet");
  });

  it("shows the solution after two wrong answers", async () => {
    const user = userEvent.setup();
    renderLesson("/practice/1.2/7");
    for (const wrong of ["5", "5"]) {
      await user.type(await screen.findByLabelText("Your answer"), wrong);
      await user.click(screen.getByTestId("primary"));
      await screen.findByTestId("try-again");
      if (wrong === "5" && screen.queryByTestId("show-me") === null)
        await user.click(screen.getByTestId("try-again"));
    }
    await user.click(await screen.findByTestId("show-me"));
    expect(screen.getByTestId("solution")).toBeInTheDocument();
  });
});
