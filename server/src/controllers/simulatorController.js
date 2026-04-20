import { z } from "zod";
import { logAttackEvent, logAuthEvent } from "../utils/logger.js";

const authSimulationSchema = z.object({
  usernameInput: z.string().max(128).optional(),
  passwordInput: z.string().max(256).optional(),
  forceInvalidCredentials: z.boolean().optional()
});

const attackSchema = z.object({
  type: z.enum(["buffer_overflow", "privilege_escalation", "trapdoor_backdoor"]),
  payload: z.record(z.any()).optional()
});

const buildStep = (id, title, success, detail) => ({
  id,
  title,
  status: success ? "success" : "failed",
  detail
});

export const runAuthSimulation = async (req, res, next) => {
  try {
    const parsed = authSimulationSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { usernameInput = "user@example.com", passwordInput = "********", forceInvalidCredentials } =
      parsed.data;

    const inputValidationSuccess = usernameInput.length <= 128 && passwordInput.length <= 256;
    const credentialVerificationSuccess = inputValidationSuccess && !forceInvalidCredentials;
    const tokenGenerationSuccess = credentialVerificationSuccess;
    const kernelAuthorizationSuccess = tokenGenerationSuccess;
    const resourceAccessSuccess = kernelAuthorizationSuccess;

    const steps = [
      buildStep(
        "input_validation",
        "Input Validation",
        inputValidationSuccess,
        inputValidationSuccess
          ? "Input conforms to strict length and character policy."
          : "Input was rejected before reaching kernel auth pipeline."
      ),
      buildStep(
        "credential_verification",
        "Credential Verification",
        credentialVerificationSuccess,
        credentialVerificationSuccess
          ? "Supabase Auth validated credentials."
          : "Credential mismatch or forced invalid scenario."
      ),
      buildStep(
        "token_generation",
        "Token Generation",
        tokenGenerationSuccess,
        tokenGenerationSuccess
          ? "JWT token minted with session binding."
          : "Token generation blocked because previous verification failed."
      ),
      buildStep(
        "kernel_authorization",
        "Kernel Authorization",
        kernelAuthorizationSuccess,
        kernelAuthorizationSuccess
          ? "Kernel ACL validated user privileges."
          : "Kernel authorization denied due to invalid auth chain."
      ),
      buildStep(
        "resource_access",
        "Resource Access",
        resourceAccessSuccess,
        resourceAccessSuccess
          ? "Protected resource access granted."
          : "Protected resource access denied."
      )
    ];

    await logAuthEvent({
      userId: req.user.userId,
      action: "auth_simulation",
      status: resourceAccessSuccess ? "success" : "failed",
      ip: req.ip,
      details: {
        stepSummary: steps.map((step) => ({ id: step.id, status: step.status }))
      }
    });

    return res.status(200).json({
      title: "OS Authentication Pipeline",
      result: resourceAccessSuccess ? "ACCESS_GRANTED" : "ACCESS_DENIED",
      steps
    });
  } catch (error) {
    return next(error);
  }
};

export const simulateAttack = async (req, res, next) => {
  try {
    const parsed = attackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { type, payload = {} } = parsed.data;
    let event = {
      type,
      severity: "high",
      blocked: true,
      description: "",
      explanation: "",
      mitigation: ""
    };

    if (type === "buffer_overflow") {
      const attemptedInput = String(payload.input ?? "A".repeat(256));
      const blocked = attemptedInput.length > 64;
      event = {
        ...event,
        blocked,
        description: `Input length ${attemptedInput.length} exceeded secure threshold (64).`,
        explanation:
          "Buffer overflow attacks push oversized payloads to overwrite memory boundaries and hijack control flow.",
        mitigation:
          "Strict boundary validation blocked the payload before kernel-level credential handlers were reached."
      };
    }

    if (type === "privilege_escalation") {
      const requestedRole = String(payload.requestedRole ?? "admin");
      const blocked = req.user.role !== "admin" && requestedRole === "admin";
      event = {
        ...event,
        blocked,
        description: `Role mutation request attempted: ${req.user.role} -> ${requestedRole}.`,
        explanation:
          "Privilege escalation attacks try to force unauthorized role upgrades to bypass RBAC enforcement.",
        mitigation:
          "Server-side RBAC policy validated JWT claims and rejected unauthorized role mutation."
      };
    }

    if (type === "trapdoor_backdoor") {
      const hiddenBypassToken = String(payload.bypassToken ?? "root::letmein");
      const blocked = hiddenBypassToken.length > 0;
      event = {
        ...event,
        blocked,
        description: "Hidden backdoor login pattern detected in unauthorized request path.",
        explanation:
          "Trapdoor/backdoor attacks use undocumented access paths or secret tokens to bypass normal authentication controls.",
        mitigation:
          "Anomaly detection engine flagged hidden bypass signature and generated a high-severity alert."
      };
    }

    await logAttackEvent({
      userId: req.user.userId,
      type: event.type,
      description: event.description,
      severity: event.severity,
      blocked: event.blocked,
      metadata: {
        actorRole: req.user.role,
        payload
      }
    });

    await logAuthEvent({
      userId: req.user.userId,
      action: `attack_simulation:${event.type}`,
      status: event.blocked ? "blocked" : "breach",
      ip: req.ip,
      details: {
        description: event.description,
        severity: event.severity
      }
    });

    return res.status(200).json({
      alert: event.blocked ? "ATTACK_BLOCKED" : "SECURITY_BREACH",
      event
    });
  } catch (error) {
    return next(error);
  }
};
