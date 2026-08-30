import { useState } from "react";
import PreExamLandingPage from "./PreExamLandingPage";
import Input from "./Input";

export default function LandingPageConfigurator({
  config = {},
  onChange = () => {},
}) {
  const [activeView, setActiveView] = useState("editor"); // "editor" | "split" | "preview"

  // Current config values with defaults
  const landingConfig = {
    enabled: config.enabled ?? false,
    eventName: config.eventName ?? "COMPUTER SOCIETY OF INDIA",
    eventTitle: config.eventTitle ?? "CSI ROUND 3",
    logo: config.logo || "/csi-logo.png",
    mainHeading: config.mainHeading ?? "CONGRATULATIONS, CODER!",
    subHeading: config.subHeading ?? "YOU'VE MADE IT TO ROUND 3",
    description:
      config.description ??
      "You successfully cleared Round 2 and earned your place in the next stage of the CSI Selection Process.",
    motivationalHeading:
      config.motivationalHeading ?? "YOU EARNED YOUR SPOT. NOW MAKE IT COUNT.",
    challengeLabel: config.challengeLabel ?? "ROUND 3 — CODING CHALLENGE",
    tagline: config.tagline ?? "THINK • CODE • SOLVE • CONQUER",
    primaryButtonText: config.primaryButtonText ?? "ENTER ROUND 3 →",
    footerText: config.footerText ?? "Best of luck! Give it your best shot.",
    theme: {
      primaryColor: config.theme?.primaryColor || "#0052cc",
      secondaryColor: config.theme?.secondaryColor || "#002b66",
      backgroundColor: config.theme?.backgroundColor || "#0a192f",
    },
    journey: {
      enabled: config.journey?.enabled ?? true,
      stages:
        config.journey?.stages && config.journey.stages.length > 0
          ? config.journey.stages
          : [
              { label: "ROUND 1", status: "completed" },
              { label: "ROUND 2", status: "cleared" },
              { label: "ROUND 3", status: "current" },
              { label: "FINAL SELECTION", status: "upcoming" },
            ],
    },
  };

  const updateConfig = (key, value) => {
    onChange({
      ...landingConfig,
      [key]: value,
    });
  };

  const updateTheme = (colorKey, colorValue) => {
    onChange({
      ...landingConfig,
      theme: {
        ...landingConfig.theme,
        [colorKey]: colorValue,
      },
    });
  };

  const updateJourneyStage = (idx, field, val) => {
    const nextStages = [...landingConfig.journey.stages];
    nextStages[idx] = { ...nextStages[idx], [field]: val };
    onChange({
      ...landingConfig,
      journey: {
        ...landingConfig.journey,
        stages: nextStages,
      },
    });
  };

  const addJourneyStage = () => {
    const nextStages = [
      ...landingConfig.journey.stages,
      { label: `STAGE ${landingConfig.journey.stages.length + 1}`, status: "upcoming" },
    ];
    onChange({
      ...landingConfig,
      journey: {
        ...landingConfig.journey,
        stages: nextStages,
      },
    });
  };

  const removeJourneyStage = (idx) => {
    const nextStages = landingConfig.journey.stages.filter((_, i) => i !== idx);
    onChange({
      ...landingConfig,
      journey: {
        ...landingConfig.journey,
        stages: nextStages,
      },
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updateConfig("logo", event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const resetToCsiPreset = () => {
    onChange({
      enabled: true,
      eventName: "COMPUTER SOCIETY OF INDIA",
      eventTitle: "CSI ROUND 3",
      logo: "/csi-logo.png",
      mainHeading: "CONGRATULATIONS, CODER!",
      subHeading: "YOU'VE MADE IT TO ROUND 3",
      description:
        "You successfully cleared Round 2 and earned your place in the next stage of the CSI Selection Process.",
      motivationalHeading: "YOU EARNED YOUR SPOT. NOW MAKE IT COUNT.",
      challengeLabel: "ROUND 3 — CODING CHALLENGE",
      tagline: "THINK • CODE • SOLVE • CONQUER",
      primaryButtonText: "ENTER ROUND 3 →",
      footerText: "Best of luck! Give it your best shot.",
      theme: {
        primaryColor: "#0052cc",
        secondaryColor: "#002b66",
        backgroundColor: "#0a192f",
      },
      journey: {
        enabled: true,
        stages: [
          { label: "ROUND 1", status: "completed" },
          { label: "ROUND 2", status: "cleared" },
          { label: "ROUND 3", status: "current" },
          { label: "FINAL SELECTION", status: "upcoming" },
        ],
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 text-ink">
      
      {/* Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-2">
            <span>🚀 Pre-Exam Landing Page</span>
            {landingConfig.enabled ? (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono font-bold px-2 py-0.5 rounded-full">
                ENABLED
              </span>
            ) : (
              <span className="text-[10px] bg-slate-500/10 text-slate-500 border border-slate-500/20 font-mono font-bold px-2 py-0.5 rounded-full">
                DISABLED
              </span>
            )}
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Display an optional event entrance screen to participants prior to instructions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToCsiPreset}
            className="text-xs font-bold text-accent hover:underline border border-accent/20 bg-accent/5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Apply CSI Round 3 Preset
          </button>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={landingConfig.enabled}
              onChange={(e) => updateConfig("enabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            <span className="ml-2 text-xs font-bold text-ink">
              {landingConfig.enabled ? "ON" : "OFF"}
            </span>
          </label>
        </div>
      </div>

      {landingConfig.enabled && (
        <div className="flex flex-col gap-6">
          
          {/* View Switcher: Editor / Split / Preview */}
          <div className="flex items-center justify-between bg-card p-1.5 rounded-xl border border-line">
            <span className="text-xs font-bold text-ink-secondary px-2">View Mode:</span>
            <div className="flex gap-1">
              {[
                { id: "editor", label: "Edit Form" },
                { id: "split", label: "Split Screen" },
                { id: "preview", label: "Full Preview" },
              ].map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeView === view.id
                      ? "bg-surface text-accent shadow-sm border border-line"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Grid */}
          <div
            className={`grid gap-6 ${
              activeView === "split"
                ? "grid-cols-1 lg:grid-cols-2"
                : activeView === "preview"
                ? "grid-cols-1"
                : "grid-cols-1"
            }`}
          >
            {/* Editor Panel */}
            {(activeView === "editor" || activeView === "split") && (
              <div className="flex flex-col gap-5 bg-surface border border-line rounded-2xl p-5 shadow-sm">
                
                {/* Logo & Branding */}
                <div className="border border-line rounded-xl p-4 bg-card/20 flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Event Logo & Branding
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-line bg-paper flex items-center justify-center overflow-hidden p-2 shrink-0">
                      <img
                        src={landingConfig.logo}
                        alt="Event Logo Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/csi-logo.png";
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-card hover:bg-line/40 text-ink border border-line rounded-lg text-xs font-bold cursor-pointer transition-all">
                          Upload Custom Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => updateConfig("logo", "/csi-logo.png")}
                          className="text-xs text-accent font-bold hover:underline cursor-pointer"
                        >
                          Use CSI Logo
                        </button>
                      </div>
                      <span className="text-[10px] text-ink-secondary">
                        PNG, JPG, SVG or WEBP up to 2MB.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Headings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Event / Organization Name"
                    value={landingConfig.eventName}
                    onChange={(e) => updateConfig("eventName", e.target.value)}
                    placeholder="e.g. Computer Society of India"
                  />
                  <Input
                    label="Event Title"
                    value={landingConfig.eventTitle}
                    onChange={(e) => updateConfig("eventTitle", e.target.value)}
                    placeholder="e.g. CSI Round 3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <Input
                      label="Main Greeting Heading"
                      value={landingConfig.mainHeading}
                      onChange={(e) => updateConfig("mainHeading", e.target.value)}
                      placeholder="e.g. Congratulations, {name}!"
                    />
                    <p className="text-[10px] text-ink-secondary mt-1">
                      💡 Use <code className="bg-card px-1 py-0.5 rounded text-accent font-bold">&#123;name&#125;</code> to insert participant's name (e.g. <span className="italic">Congratulations, &#123;name&#125;!</span>).
                    </p>
                  </div>
                  <Input
                    label="Sub Heading"
                    value={landingConfig.subHeading}
                    onChange={(e) => updateConfig("subHeading", e.target.value)}
                    placeholder="e.g. YOU'VE MADE IT TO ROUND 3"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">Description Note</label>
                  <textarea
                    value={landingConfig.description}
                    onChange={(e) => updateConfig("description", e.target.value)}
                    rows={2}
                    className="w-full text-xs text-ink bg-card border border-line rounded-xl p-3 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    placeholder="Describe the participant's achievement..."
                  />
                </div>

                <Input
                  label="Motivational Heading Banner"
                  value={landingConfig.motivationalHeading}
                  onChange={(e) => updateConfig("motivationalHeading", e.target.value)}
                  placeholder="e.g. YOU EARNED YOUR SPOT. NOW MAKE IT COUNT."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Challenge Label"
                    value={landingConfig.challengeLabel}
                    onChange={(e) => updateConfig("challengeLabel", e.target.value)}
                    placeholder="e.g. ROUND 3 — CODING CHALLENGE"
                  />
                  <Input
                    label="Tagline"
                    value={landingConfig.tagline}
                    onChange={(e) => updateConfig("tagline", e.target.value)}
                    placeholder="e.g. THINK • CODE • SOLVE • CONQUER"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="CTA Button Text"
                    value={landingConfig.primaryButtonText}
                    onChange={(e) => updateConfig("primaryButtonText", e.target.value)}
                    placeholder="e.g. ENTER ROUND 3 →"
                  />
                  <Input
                    label="Footer Text"
                    value={landingConfig.footerText}
                    onChange={(e) => updateConfig("footerText", e.target.value)}
                    placeholder="e.g. Best of luck! Give it your best shot."
                  />
                </div>

                {/* Appearance Theme */}
                <div className="border border-line rounded-xl p-4 bg-card/20 flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Appearance & Theme Colors
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink">Primary Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={landingConfig.theme.primaryColor}
                          onChange={(e) => updateTheme("primaryColor", e.target.value)}
                          className="w-8 h-8 rounded border border-line cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-ink">
                          {landingConfig.theme.primaryColor}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={landingConfig.theme.backgroundColor}
                          onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                          className="w-8 h-8 rounded border border-line cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-ink">
                          {landingConfig.theme.backgroundColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Journey Stages */}
                <div className="border border-line rounded-xl p-4 bg-card/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                        Selection Journey Component
                      </span>
                      <p className="text-[10px] text-ink-secondary">
                        Configure candidate qualification pipeline stages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addJourneyStage}
                      className="text-xs font-bold text-accent hover:underline cursor-pointer"
                    >
                      + Add Stage
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer my-1">
                    <input
                      type="checkbox"
                      checked={landingConfig.journey.enabled}
                      onChange={(e) =>
                        onChange({
                          ...landingConfig,
                          journey: {
                            ...landingConfig.journey,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded border-line text-accent"
                    />
                    <span>Show Journey Component</span>
                  </label>

                  {landingConfig.journey.enabled && (
                    <div className="flex flex-col gap-2 mt-1">
                      {landingConfig.journey.stages.map((stage, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-paper p-2 rounded-lg border border-line">
                          <input
                            type="text"
                            value={stage.label}
                            onChange={(e) => updateJourneyStage(idx, "label", e.target.value)}
                            className="flex-1 text-xs font-bold text-ink bg-transparent outline-none px-2 py-1 border border-transparent focus:border-accent rounded"
                            placeholder="Stage Name"
                          />
                          <select
                            value={stage.status}
                            onChange={(e) => updateJourneyStage(idx, "status", e.target.value)}
                            className="text-xs font-mono font-bold bg-surface border border-line text-ink rounded px-2 py-1 cursor-pointer"
                          >
                            <option value="completed">Completed</option>
                            <option value="cleared">Cleared</option>
                            <option value="current">Current (You are here)</option>
                            <option value="upcoming">Upcoming</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeJourneyStage(idx)}
                            className="text-xs text-danger hover:underline px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Live Interactive Preview Panel */}
            {(activeView === "preview" || activeView === "split") && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Participant Preview
                  </span>
                  <span className="text-[10px] text-ink-secondary">
                    Shows candidate perspective in real-time
                  </span>
                </div>

                <div className="sticky top-4">
                  <PreExamLandingPage
                    config={landingConfig}
                    candidateName="Uday Kiran"
                    isPreview={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
