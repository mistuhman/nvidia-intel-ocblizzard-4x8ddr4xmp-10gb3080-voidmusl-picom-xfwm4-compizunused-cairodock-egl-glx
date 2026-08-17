#!/usr/bin/env python3
"""Regression tests for wallpaper and Compiz resource lifecycle fixes."""
from importlib.machinery import SourceFileLoader
from pathlib import Path
import re
import tempfile
import types
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]


def load_script(module_name, relative_path):
    loader = SourceFileLoader(module_name, str(ROOT / relative_path))
    module = types.ModuleType(loader.name)
    module.__file__ = loader.path
    loader.exec_module(module)
    return module


controller = load_script("xmb_controller_test", "scripts/xmb-wallpaper-controller")
compiz = load_script("compiz_game_test", "scripts/compiz-game-performance")


class FakeIPC:
    def __init__(self):
        self.calls = []

    def call(self, *args):
        self.calls.append(args)
        return None


class WallpaperLifecycleTests(unittest.TestCase):
    IDS = {"main-red": 1, "work-monochrome": 2, "sleep": 3}

    def test_idle_graph_selects_exactly_one_track(self):
        self.assertEqual(controller.steady("work-monochrome", self.IDS), "[vid2]null[vo]")
        fake = FakeIPC()
        graph = controller.set_steady(fake, "main-red", self.IDS)
        self.assertEqual(graph, "[vid1]null[vo]")
        self.assertEqual(fake.calls, [("set_property", "lavfi-complex", "[vid1]null[vo]")])

    def test_transition_graph_selects_only_source_and_target(self):
        graph = controller.blend({"main-red": 1.0}, "work-monochrome", self.IDS, 21)
        self.assertEqual(set(re.findall(r"\[vid(\d+)\]", graph)), {"1", "2"})
        self.assertNotIn("[vid3]", graph)

    def test_selected_track_observability(self):
        tracks = [
            {"id": 1, "type": "video", "selected": True},
            {"id": 2, "type": "video", "selected": False},
            {"id": 3, "type": "audio", "selected": True},
        ]
        self.assertEqual(controller.selected_video_tracks(tracks), [1])

    def test_fullscreen_detection_parsers(self):
        self.assertEqual(
            controller.active_window_id("_NET_ACTIVE_WINDOW(WINDOW): window id # 0x03A00007"),
            "0x03a00007",
        )
        self.assertEqual(controller.active_window_id("window id # 0x0"), "")
        self.assertTrue(controller.fullscreen_state("_NET_WM_STATE_FULLSCREEN, _NET_WM_STATE_ABOVE"))
        self.assertFalse(controller.fullscreen_state("_NET_WM_STATE_ABOVE"))

    def test_fullscreen_probe_failure_is_indeterminate_not_resume(self):
        failed = types.SimpleNamespace(returncode=1, stdout="")
        with mock.patch.object(controller.subprocess, "run", return_value=failed):
            self.assertEqual(controller.active_fullscreen(), (None, ""))
        with mock.patch.object(
            controller.subprocess,
            "run",
            side_effect=controller.subprocess.TimeoutExpired("xprop", 0.4),
        ):
            self.assertEqual(controller.active_fullscreen(), (None, ""))

    def test_pause_command_is_boolean(self):
        fake = FakeIPC()
        controller.set_pause(fake, True)
        controller.set_pause(fake, False)
        self.assertEqual(
            fake.calls,
            [("set_property", "pause", True), ("set_property", "pause", False)],
        )

    def test_fullscreen_pause_config_defaults_on_and_can_be_disabled(self):
        old = controller.CFG
        try:
            with tempfile.TemporaryDirectory() as directory:
                cfg = Path(directory) / "xmb.conf"
                controller.CFG = cfg
                self.assertTrue(controller.config()["pause_fullscreen"])
                cfg.write_text(
                    "ROLES=(main-red work-monochrome work-monochrome main-red)\n"
                    "PAUSE_FULLSCREEN=0\n"
                )
                self.assertFalse(controller.config()["pause_fullscreen"])
        finally:
            controller.CFG = old

    def test_zero_opacity_hold_graph_is_gone(self):
        source = (ROOT / "scripts/xmb-wallpaper-controller").read_text()
        self.assertNotIn("def hold(", source)
        self.assertNotIn("blend=all_opacity=0", source)


class ShaderLifecycleTests(unittest.TestCase):
    def test_every_blur_pass_is_skipped_at_zero_strength(self):
        source = (ROOT / "scripts/xmb-transition-blur.glsl").read_text()
        blocks = source.split("//!HOOK MAIN")[1:]
        self.assertEqual(len(blocks), 2)
        for block in blocks:
            header = block.split("vec4 hook()", 1)[0]
            self.assertIn("//!WHEN xmb_strength 0 >", header)


class CompizPerformanceTests(unittest.TestCase):
    def test_enable_unredirect_adds_only_composite_setting(self):
        original = ["[core]", "s0_refresh_rate = 120", "", "[wall]", "s0_hsize = 4"]
        updated, changed = compiz.enable_unredirect(original)
        self.assertTrue(changed)
        self.assertEqual(updated[:5], original)
        self.assertEqual(compiz.setting(updated), "true")
        again, changed_again = compiz.enable_unredirect(updated)
        self.assertFalse(changed_again)
        self.assertEqual(again, updated)

    def test_enable_unredirect_canonicalizes_duplicates_without_other_drift(self):
        original = [
            "[composite]",
            "s0_unredirect_fullscreen_windows = false",
            "s0_slow_animations = false",
            "s0_unredirect_fullscreen_windows = false",
            "[core]",
            "s0_refresh_rate = 120",
        ]
        updated, changed = compiz.enable_unredirect(original)
        self.assertTrue(changed)
        self.assertEqual(updated.count("s0_unredirect_fullscreen_windows = true"), 1)
        self.assertIn("s0_slow_animations = false", updated)
        self.assertEqual(updated[-2:], ["[core]", "s0_refresh_rate = 120"])

    def test_installers_expose_performance_controls(self):
        runtime = (ROOT / "scripts/xmb-runtime-install").read_text()
        guard = (ROOT / "scripts/compiz-guard-install").read_text()
        self.assertIn("PAUSE_FULLSCREEN=1", runtime)
        self.assertIn("install_one compiz-game-performance", guard)


if __name__ == "__main__":
    unittest.main()
