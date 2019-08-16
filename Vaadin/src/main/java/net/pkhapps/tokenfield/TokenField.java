package net.pkhapps.tokenfield;

import com.vaadin.flow.component.AbstractField;
import com.vaadin.flow.component.HasSize;
import com.vaadin.flow.component.ItemLabelGenerator;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.data.binder.HasItems;
import com.vaadin.flow.data.selection.MultiSelect;
import com.vaadin.flow.data.selection.MultiSelectionEvent;
import com.vaadin.flow.data.selection.MultiSelectionListener;
import com.vaadin.flow.dom.DomEvent;
import com.vaadin.flow.function.SerializableComparator;
import com.vaadin.flow.shared.Registration;
import elemental.json.Json;
import elemental.json.JsonArray;
import elemental.json.JsonObject;
import elemental.json.JsonValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @param <V>
 */
@Tag("token-field")
@JsModule("token-field/token-field.js")
public class TokenField<V> extends AbstractField<TokenField<V>, Set<V>>
        implements MultiSelect<TokenField<V>, V>, HasItems<V>, HasSize {

    private static final Logger LOGGER = LoggerFactory.getLogger(TokenField.class);

    private ItemLabelGenerator<V> itemLabelGenerator;
    private ItemIdGenerator<V> itemIdGenerator;
    private SerializableComparator<V> itemComparator;
    private NewItemHandler<V> newItemHandler;
    private Map<String, V> items;

    /**
     *
     */
    public TokenField() {
        super(Collections.emptySet());
        getElement().addEventListener("removedToken", this::onClientSideTokenRemoved);
        getElement().addEventListener("addedToken", this::onClientSideTokenAdded);
    }

    /**
     * @return
     */
    public ItemLabelGenerator<V> getItemLabelGenerator() {
        return itemLabelGenerator;
    }

    /**
     * @param itemLabelGenerator
     */
    public void setItemLabelGenerator(ItemLabelGenerator<V> itemLabelGenerator) {
        this.itemLabelGenerator = itemLabelGenerator;
    }

    /**
     * @return
     */
    public SerializableComparator<V> getItemComparator() {
        return itemComparator;
    }

    /**
     * @param itemComparator
     */
    public void setItemComparator(SerializableComparator<V> itemComparator) {
        this.itemComparator = itemComparator;
    }

    /**
     * @return
     */
    public ItemIdGenerator<V> getItemIdGenerator() {
        return itemIdGenerator;
    }

    /**
     * @param itemIdGenerator
     */
    public void setItemIdGenerator(ItemIdGenerator<V> itemIdGenerator) {
        this.itemIdGenerator = itemIdGenerator;
    }

    /**
     * @return
     */
    public NewItemHandler<V> getNewItemHandler() {
        return newItemHandler;
    }

    /**
     * @param newItemHandler
     */
    public void setNewItemHandler(NewItemHandler<V> newItemHandler) {
        this.newItemHandler = newItemHandler;
    }

    @Override
    public void updateSelection(Set<V> addedItems, Set<V> removedItems) {
        Set<V> selection = new HashSet<>(getValue());
        selection.addAll(addedItems);
        selection.removeAll(removedItems);
        setValue(selection);
    }

    @Override
    public Set<V> getSelectedItems() {
        return getValue();
    }

    @Override
    public Registration addSelectionListener(MultiSelectionListener<TokenField<V>, V> listener) {
        return addValueChangeListener(event -> listener.selectionChange(new MultiSelectionEvent<>(
                TokenField.this, TokenField.this, event.getOldValue(), event.isFromClient())));
    }

    @Override
    protected void setPresentationValue(Set<V> newPresentationValue) {
        getElement().setPropertyJson("tokens", convertItemsToJson(newPresentationValue));
    }

    private JsonValue convertItemsToJson(Collection<V> items) {
        List<V> sortedList = sortItems(items);
        JsonArray json = Json.createArray();
        for (int i = 0; i < sortedList.size(); ++i) {
            json.set(i, convertItemToJson(sortedList.get(i)));
        }
        return json;
    }

    private List<V> sortItems(Collection<V> items) {
        List<V> sortedList = new ArrayList<>(items);
        if (itemComparator != null) {
            sortedList.sort(itemComparator);
        }
        return sortedList;
    }

    private JsonValue convertItemToJson(V item) {
        JsonObject json = Json.createObject();
        json.put("id", getItemId(item));
        json.put("label", getItemLabel(item));
        return json;
    }

    private String getItemLabel(V item) {
        return itemLabelGenerator == null ? item.toString() : itemLabelGenerator.apply(item);
    }

    private String getItemId(V item) {
        return itemIdGenerator == null ? item.toString() : itemIdGenerator.apply(item);
    }

    @Override
    public void setItems(Collection<V> items) {
        this.items = items.stream().collect(Collectors.toMap(this::getItemId, v -> v));
        updateClientSideItems();
    }

    /**
     * @param item
     */
    public void addItem(V item) {
        if (this.items.putIfAbsent(getItemId(item), item) == null) {
            updateClientSideItems();
        }
    }

    /**
     * @param item
     */
    public void removeItem(V item) {
        if (this.items.remove(getItemId(item)) != null) {
            updateClientSideItems();
        }
    }

    private void updateClientSideItems() {
        getElement().setPropertyJson("items", convertItemsToJson(this.items.values()));
    }

    private void onClientSideTokenRemoved(DomEvent event) {
        JsonValue removedToken = event.getEventData().get("removedToken");
        if (removedToken != null) {
            onClientSideTokenRemoved(removedToken.asString());
        }
    }

    private void onClientSideTokenRemoved(String token) {
        V item = items.get(token);
        if (item != null) {
            LOGGER.debug("Removing token '{}'", token);
            updateSelection(Collections.emptySet(), Collections.singleton(item));
        } else {
            LOGGER.warn("Tried to remove token '{}' that did not exist in the item map", token);
        }
    }

    private void onClientSideTokenAdded(DomEvent event) {
        JsonValue addedToken = event.getEventData().get("addedToken");
        if (addedToken != null) {
            onClientSideTokenAdded(addedToken.asString());
        }
    }

    private void onClientSideTokenAdded(String token) {
        V item = items.get(token);
        if (item != null) {
            LOGGER.debug("Adding token '{}'", token);
            updateSelection(Collections.singleton(item), Collections.emptySet());
        } else if (newItemHandler != null) {
            LOGGER.debug("Invoking NewItemHandler with token '{}'", token);
            newItemHandler.handleNewItem(this, token);
        } else {
            LOGGER.warn("Tried to add token '{}' that did not exist in the item map", token);
        }
    }

    /**
     * @return
     */
    public String getTokenSeparator() {
        return getElement().getProperty("tokenSeparator", " ");
    }

    /**
     * @param tokenSeparator
     */
    public void setTokenSeparator(String tokenSeparator) {
        // TODO Validate value
        getElement().setProperty("tokenSeparator", tokenSeparator);
    }

    /**
     * @return
     */
    public String getLabel() {
        return getElement().getProperty("label", "");
    }

    /**
     *
     * @param label
     */
    public void setLabel(String label) {
        getElement().setProperty("label", label == null ? "" : label);
    }
}