package net.pkhapps.tokenfield;

import com.vaadin.flow.function.SerializableFunction;

/**
 * TODO Document me
 * @param <V>
 */
@FunctionalInterface
public interface ItemIdGenerator<V> extends SerializableFunction<V, String> {
}
