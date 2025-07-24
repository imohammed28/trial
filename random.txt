# In the POST method, update this section:

# Add hint if message wasn't angry enough
if not is_angry and msg_count < KAREN_THRESHOLD:
    # Only show angry hint after 4th message (they've bypassed frontend)
    if msg_count >= 4:
        bonus_message = "Hmm, that didn't sound angry enough. Are you angry? Real Karens use more CAPS and exclamation marks!!!"
    else:
        # For first 3 messages, no hint about being angry
        bonus_message = ""

# Or more simply, replace the entire if block with:
if not is_angry and msg_count >= 4 and msg_count < KAREN_THRESHOLD:
    bonus_message = "Hmm, that didn't sound angry enough. Are you angry? Real Karens use more CAPS and exclamation marks!!!"
