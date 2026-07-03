// ============================================================
// ORDER RULES TEST
// Phase 4 Step 7: State Transition Rules
// ============================================================

import { describe, it, expect } from "vitest"
import { OrderRules } from "../../../modules/order/order.rules"
import { BusinessError } from "../../../shared/errors/business.error"

describe("OrderRules - State Transitions", () => {
  // ===== Valid Transitions =====

  describe("canTransition", () => {
    it("should allow DRAFT -> CONFIRMED", () => {
      expect(OrderRules.canTransition("DRAFT", "CONFIRMED")).toBe(true)
    })

    it("should allow DRAFT -> CANCELLED", () => {
      expect(OrderRules.canTransition("DRAFT", "CANCELLED")).toBe(true)
    })

    it("should allow DRAFT -> EXPIRED", () => {
      expect(OrderRules.canTransition("DRAFT", "EXPIRED")).toBe(true)
    })

    it("should allow CONFIRMED -> PAID", () => {
      expect(OrderRules.canTransition("CONFIRMED", "PAID")).toBe(true)
    })

    it("should allow CONFIRMED -> CANCELLED", () => {
      expect(OrderRules.canTransition("CONFIRMED", "CANCELLED")).toBe(true)
    })

    it("should allow PAID -> SHIPPING", () => {
      expect(OrderRules.canTransition("PAID", "SHIPPING")).toBe(true)
    })

    it("should allow PAID -> CANCELLED", () => {
      expect(OrderRules.canTransition("PAID", "CANCELLED")).toBe(true)
    })

    it("should allow SHIPPING -> DELIVERED", () => {
      expect(OrderRules.canTransition("SHIPPING", "DELIVERED")).toBe(true)
    })

    it("should allow SHIPPING -> CANCELLED", () => {
      expect(OrderRules.canTransition("SHIPPING", "CANCELLED")).toBe(true)
    })
  })

  // ===== Invalid Transitions =====

  describe("canTransition - invalid transitions", () => {
    it("should NOT allow DRAFT -> PAID", () => {
      expect(OrderRules.canTransition("DRAFT", "PAID")).toBe(false)
    })

    it("should NOT allow DRAFT -> SHIPPING", () => {
      expect(OrderRules.canTransition("DRAFT", "SHIPPING")).toBe(false)
    })

    it("should NOT allow DRAFT -> DELIVERED", () => {
      expect(OrderRules.canTransition("DRAFT", "DELIVERED")).toBe(false)
    })

    it("should NOT allow CONFIRMED -> SHIPPING", () => {
      expect(OrderRules.canTransition("CONFIRMED", "SHIPPING")).toBe(false)
    })

    it("should NOT allow DELIVERED -> any state", () => {
      expect(OrderRules.canTransition("DELIVERED", "DRAFT")).toBe(false)
      expect(OrderRules.canTransition("DELIVERED", "CONFIRMED")).toBe(false)
      expect(OrderRules.canTransition("DELIVERED", "PAID")).toBe(false)
      expect(OrderRules.canTransition("DELIVERED", "CANCELLED")).toBe(false)
    })

    it("should NOT allow CANCELLED -> any state", () => {
      expect(OrderRules.canTransition("CANCELLED", "DRAFT")).toBe(false)
      expect(OrderRules.canTransition("CANCELLED", "CONFIRMED")).toBe(false)
      expect(OrderRules.canTransition("CANCELLED", "PAID")).toBe(false)
    })

    it("should NOT allow EXPIRED -> any state", () => {
      expect(OrderRules.canTransition("EXPIRED", "DRAFT")).toBe(false)
      expect(OrderRules.canTransition("EXPIRED", "CONFIRMED")).toBe(false)
      expect(OrderRules.canTransition("EXPIRED", "PAID")).toBe(false)
    })
  })

  // ===== assertTransition =====

  describe("assertTransition", () => {
    it("should NOT throw for valid transition", () => {
      expect(() => {
        OrderRules.assertTransition("DRAFT", "CONFIRMED")
      }).not.toThrow()
    })

    it("should throw BusinessError for invalid transition", () => {
      expect(() => {
        OrderRules.assertTransition("DRAFT", "PAID")
      }).toThrow(BusinessError)
    })

    it("should include correct error code", () => {
      try {
        OrderRules.assertTransition("DRAFT", "PAID")
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessError)
        expect((error as BusinessError).code).toBe("INVALID_STATE_TRANSITION")
      }
    })
  })

  // ===== getValidNextStates =====

  describe("getValidNextStates", () => {
    it("should return valid next states for DRAFT", () => {
      const states = OrderRules.getValidNextStates("DRAFT")
      expect(states).toContain("CONFIRMED")
      expect(states).toContain("CANCELLED")
      expect(states).toContain("EXPIRED")
      expect(states.length).toBe(3)
    })

    it("should return valid next states for CONFIRMED", () => {
      const states = OrderRules.getValidNextStates("CONFIRMED")
      expect(states).toContain("PAID")
      expect(states).toContain("CANCELLED")
      expect(states.length).toBe(2)
    })

    it("should return empty array for terminal states", () => {
      expect(OrderRules.getValidNextStates("DELIVERED")).toEqual([])
      expect(OrderRules.getValidNextStates("CANCELLED")).toEqual([])
      expect(OrderRules.getValidNextStates("EXPIRED")).toEqual([])
    })
  })

  // ===== isTerminalState =====

  describe("isTerminalState", () => {
    it("should return true for DELIVERED", () => {
      expect(OrderRules.isTerminalState("DELIVERED")).toBe(true)
    })

    it("should return true for CANCELLED", () => {
      expect(OrderRules.isTerminalState("CANCELLED")).toBe(true)
    })

    it("should return true for EXPIRED", () => {
      expect(OrderRules.isTerminalState("EXPIRED")).toBe(true)
    })

    it("should return false for DRAFT", () => {
      expect(OrderRules.isTerminalState("DRAFT")).toBe(false)
    })

    it("should return false for CONFIRMED", () => {
      expect(OrderRules.isTerminalState("CONFIRMED")).toBe(false)
    })

    it("should return false for PAID", () => {
      expect(OrderRules.isTerminalState("PAID")).toBe(false)
    })

    it("should return false for SHIPPING", () => {
      expect(OrderRules.isTerminalState("SHIPPING")).toBe(false)
    })
  })
})
